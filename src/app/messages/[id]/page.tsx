"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { ConversationWithMessages, Message } from "@/lib/types";

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isYesterday) {
    return `Yesterday ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, refreshConversations } = useAuth();
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversationId = params.id as string;

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data: ConversationWithMessages = await res.json();
        setConversation(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
    pollRef.current = setInterval(fetchConversation, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    return () => {
      refreshConversations();
    };
  }, [refreshConversations]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending || !user) return;

    setSending(true);
    setNewMessage("");

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.accountId,
      senderName: user.name,
      senderAvatarUrl: user.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };
    setConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
    );

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setConversation((prev) => {
          if (!prev) return prev;
          const msgs = prev.messages.filter((m) => m.id !== optimisticMsg.id);
          return { ...prev, messages: [...msgs, msg] };
        });
      }
    } catch {
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m) => m.id !== optimisticMsg.id),
        };
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Conversation not found</p>
          <button
            onClick={() => router.push("/messages")}
            className="mt-2 text-sm text-primary hover:underline cursor-pointer"
          >
            Back to messages
          </button>
        </div>
      </div>
    );
  }

  const other = conversation.participants.find((p) => p.accountId !== user?.accountId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        {/* Back button — visible on mobile to return to conversation list */}
        <button
          onClick={() => router.push("/messages")}
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors md:hidden cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        {other?.avatarUrl ? (
          <img
            src={other.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full shrink-0"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary shrink-0">
            {other?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {other?.name ?? "Unknown"}
          </p>
          {conversation.listingTitle && (
            <Link
              href={`/listings/${conversation.listingId}`}
              className="text-xs text-primary hover:underline truncate block"
            >
              {conversation.listingTitle}
            </Link>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversation.messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.accountId;
              const prev = idx > 0 ? conversation.messages[idx - 1] : null;
              const showAvatar = !prev || prev.senderId !== msg.senderId;
              const showTimestamp =
                !prev ||
                new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() >
                  5 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {showTimestamp && (
                    <p className="my-3 text-center text-[11px] text-muted/60">
                      {formatTimestamp(msg.createdAt)}
                    </p>
                  )}
                  <div
                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${
                      showAvatar ? "mt-3" : "mt-0.5"
                    }`}
                  >
                    <div className="w-8 shrink-0">
                      {showAvatar && !isMe && (
                        <>
                          {msg.senderAvatarUrl ? (
                            <img
                              src={msg.senderAvatarUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                              {msg.senderName.charAt(0)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-muted/15 text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted/50">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
