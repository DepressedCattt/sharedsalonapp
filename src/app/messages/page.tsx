"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import type { Conversation } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

const AVATAR_COLORS = [
  "bg-primary-light text-primary",
  "bg-rose-100 text-rose-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-amber-100 text-amber-600",
  "bg-teal-100 text-teal-600",
  "bg-emerald-100 text-emerald-600",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Please log in to view your messages.</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>
      <Navbar />
      <ConversationList userAccountId={`${user.id}_${user.role}`} userRole={user.role} />
    </div>
  );
}

// ─── Conversation list ────────────────────────────────────────────────────────

type TabFilter = "all" | "unread";

function ConversationList({ userAccountId, userRole }: { userAccountId: string; userRole: string }) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    const other = c.participants.find((p) => p.accountId !== userAccountId);
    const matchesFilter = filter === "all" || (filter === "unread" && c.unreadCount > 0);
    const matchesSearch =
      !search ||
      other?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.listingTitle?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const tabs: { label: string; value: TabFilter; count: number }[] = [
    { label: "All", value: "all", count: conversations.length },
    { label: "Unread", value: "unread", count: conversations.filter((c) => c.unreadCount > 0).length },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="flex flex-col border-r border-border bg-card w-full md:w-80 lg:w-96 shrink-0">
        {/* Header */}
        <div className="border-b border-border px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-muted">{totalUnread} unread</p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                filter === tab.value
                  ? "bg-primary text-white"
                  : "bg-muted/15 text-muted hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 ${filter === tab.value ? "opacity-70" : "opacity-60"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-border/50">
                  <div className="h-11 w-11 rounded-full bg-muted/20 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-32 bg-muted/20 rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-muted/15 rounded animate-pulse" />
                    <div className="h-2.5 w-40 bg-muted/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <svg className="h-8 w-8 text-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-sm font-medium text-foreground">No conversations</p>
              <p className="mt-1 text-xs text-muted">
                {search ? "Try a different search" : "Conversations will appear here"}
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const other = conv.participants.find((p) => p.accountId !== userAccountId);
              if (!other) return null;
              const isLastMine = conv.lastMessage?.senderId === userAccountId;
              const color = avatarColor(other.name);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/10 ${
                    conv.unreadCount > 0 ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative mt-0.5 shrink-0">
                    {other.avatarUrl ? (
                      <img
                        src={other.avatarUrl}
                        alt={other.name}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${color}`}>
                        {other.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-sm truncate leading-snug ${conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                        {other.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted mt-0.5">
                        {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : timeAgo(conv.createdAt)}
                      </span>
                    </div>

                    {conv.listingTitle && (
                      <p className="mt-0.5 text-[10px] text-muted truncate">{conv.listingTitle}</p>
                    )}

                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className={`text-xs truncate leading-snug ${conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted"}`}>
                        {conv.lastMessage ? (
                          <>
                            {isLastMine && <span className="text-muted">You: </span>}
                            {conv.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Empty state (desktop) ─────────────────────────────── */}
      <main className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-background/50 px-6 text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="h-10 w-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary/20" />
          <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-accent/30" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your messages</h2>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Select a conversation on the left to start chatting, or browse{" "}
            {userRole === "venue" ? "your listings" : "available chairs"} to connect with{" "}
            {userRole === "venue" ? "freelancers" : "venues"}.
          </p>
        </div>
      </main>
    </div>
  );
}
