"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

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

function formatMsgTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ─── Mock data ────────────────────────────────────────────────────────────────

type ConvCategory = "active" | "inquiry" | "archived";

interface MockConv {
  id: string;
  otherName: string;
  otherInitial: string;
  otherColor: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageMine: boolean;
  lastTime: string;
  unread: number;
  category: ConvCategory;
  forRole: "venue" | "renter";
  online?: boolean;
}

interface MockMsg {
  id: string;
  from: "me" | "other";
  content: string;
  time: string;
}

const VENUE_CONVS: MockConv[] = [
  {
    id: "v1", otherName: "Sarah Mitchell", otherInitial: "S", otherColor: "bg-rose-100 text-rose-600",
    listingTitle: "Premium Chair — Mayfair", lastMessage: "Thanks! See you Monday 👋",
    lastMessageMine: false, lastTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    unread: 0, category: "active", forRole: "venue", online: true,
  },
  {
    id: "v2", otherName: "Jake Thompson", otherInitial: "J", otherColor: "bg-blue-100 text-blue-600",
    listingTitle: "Mon–Fri Chair Rental", lastMessage: "Hi, I'm a senior stylist and very interested in your space...",
    lastMessageMine: false, lastTime: new Date(Date.now() - 28 * 60000).toISOString(),
    unread: 2, category: "inquiry", forRole: "venue",
  },
  {
    id: "v3", otherName: "Emma Davis", otherInitial: "E", otherColor: "bg-violet-100 text-violet-600",
    listingTitle: "Premium Chair — Mayfair", lastMessage: "Quick question about the parking situation?",
    lastMessageMine: false, lastTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    unread: 1, category: "active", forRole: "venue", online: true,
  },
  {
    id: "v4", otherName: "Michael Chen", otherInitial: "M", otherColor: "bg-amber-100 text-amber-600",
    listingTitle: "Weekend Styling Suite", lastMessage: "Would you consider a monthly arrangement?",
    lastMessageMine: false, lastTime: new Date(Date.now() - 86400000).toISOString(),
    unread: 0, category: "inquiry", forRole: "venue",
  },
  {
    id: "v5", otherName: "Priya Sharma", otherInitial: "P", otherColor: "bg-teal-100 text-teal-600",
    listingTitle: "Nail Tech Station", lastMessage: "Thanks for everything, it was a great experience!",
    lastMessageMine: false, lastTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    unread: 0, category: "archived", forRole: "venue",
  },
];

const RENTER_CONVS: MockConv[] = [
  {
    id: "r1", otherName: "The Style Hub", otherInitial: "T", otherColor: "bg-primary-light text-primary",
    listingTitle: "Premium Chair — Mayfair", lastMessage: "Your booking is confirmed for Monday! Excited to have you.",
    lastMessageMine: false, lastTime: new Date(Date.now() - 3600000).toISOString(),
    unread: 1, category: "active", forRole: "renter", online: true,
  },
  {
    id: "r2", otherName: "Luxe Beauty Lounge", otherInitial: "L", otherColor: "bg-rose-100 text-rose-600",
    listingTitle: "Weekend Chair Rental", lastMessage: "Hi, I'm interested in renting a chair this weekend...",
    lastMessageMine: true, lastTime: new Date(Date.now() - 3 * 3600000).toISOString(),
    unread: 0, category: "inquiry", forRole: "renter",
  },
  {
    id: "r3", otherName: "Modern Cuts Studio", otherInitial: "M", otherColor: "bg-emerald-100 text-emerald-600",
    listingTitle: "Tue / Thu Chair", lastMessage: "We'd love to have you join our studio family!",
    lastMessageMine: false, lastTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    unread: 2, category: "inquiry", forRole: "renter",
  },
];

const MOCK_MESSAGES: Record<string, MockMsg[]> = {
  v1: [
    { id: "1", from: "other", content: "Hi! I just got approved for the Monday booking 🎉", time: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: "2", from: "me", content: "Welcome to the studio Sarah! Really excited to have you here.", time: new Date(Date.now() - 25 * 3600000).toISOString() },
    { id: "3", from: "me", content: "We're on the 2nd floor — there's a lift on the right as you enter. I'll leave a key at the front desk.", time: new Date(Date.now() - 25 * 3600000 + 30000).toISOString() },
    { id: "4", from: "other", content: "Perfect! What time should I arrive to set up before my first client?", time: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: "5", from: "me", content: "I'd suggest arriving 30 mins early. We open at 8:30am so anytime after that works.", time: new Date(Date.now() - 23 * 3600000).toISOString() },
    { id: "6", from: "other", content: "Amazing — is there somewhere I can park nearby?", time: new Date(Date.now() - 22 * 3600000).toISOString() },
    { id: "7", from: "me", content: "Yes! There's an NCP on Brook Street about 2 mins walk away. Street parking is also free after 6:30pm.", time: new Date(Date.now() - 21 * 3600000).toISOString() },
    { id: "8", from: "other", content: "Thanks! See you Monday 👋", time: new Date(Date.now() - 2 * 3600000).toISOString() },
  ],
  v2: [
    { id: "1", from: "other", content: "Hi! I'm a senior stylist with 8 years of experience and I came across your listing.", time: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: "2", from: "other", content: "I specialise in colour and balayage — would I be able to use the backwash basins?", time: new Date(Date.now() - 44 * 60000).toISOString() },
    { id: "3", from: "other", content: "Hi, I'm a senior stylist and very interested in your space...", time: new Date(Date.now() - 28 * 60000).toISOString() },
  ],
  v3: [
    { id: "1", from: "other", content: "Hey! I just wanted to check — is there parking nearby for the Mayfair studio?", time: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: "2", from: "me", content: "Hi Emma! Yes, there's a car park on Brook Street about 2 mins away.", time: new Date(Date.now() - 4.5 * 3600000).toISOString() },
    { id: "3", from: "other", content: "Quick question about the parking situation?", time: new Date(Date.now() - 4 * 3600000).toISOString() },
  ],
  v4: [
    { id: "1", from: "other", content: "Hello! I'm really interested in the weekend styling suite.", time: new Date(Date.now() - 25 * 3600000).toISOString() },
    { id: "2", from: "me", content: "Hi Michael! Great to hear from you. What did you have in mind?", time: new Date(Date.now() - 24.5 * 3600000).toISOString() },
    { id: "3", from: "other", content: "Would you consider a monthly arrangement?", time: new Date(Date.now() - 24 * 3600000).toISOString() },
  ],
  v5: [
    { id: "1", from: "me", content: "Hi Priya! Your station is all set for Tuesday. Let me know if you need anything.", time: new Date(Date.now() - 8 * 86400000).toISOString() },
    { id: "2", from: "other", content: "Perfect, see you then!", time: new Date(Date.now() - 8 * 86400000 + 60000).toISOString() },
    { id: "3", from: "other", content: "Thanks for everything, it was a great experience!", time: new Date(Date.now() - 7 * 86400000).toISOString() },
  ],
  r1: [
    { id: "1", from: "me", content: "Hi! I'd love to book the premium chair for Monday. I have 3 clients scheduled.", time: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "2", from: "other", content: "Hi! I've reviewed your profile and I'm happy to approve the booking 🎉", time: new Date(Date.now() - 23 * 3600000).toISOString() },
    { id: "3", from: "other", content: "The studio is on the 2nd floor. Lift code is 2847. I'll leave a welcome pack at the chair.", time: new Date(Date.now() - 22 * 3600000).toISOString() },
    { id: "4", from: "me", content: "Amazing, thank you! Really looking forward to it.", time: new Date(Date.now() - 21 * 3600000).toISOString() },
    { id: "5", from: "other", content: "Your booking is confirmed for Monday! Excited to have you.", time: new Date(Date.now() - 3600000).toISOString() },
  ],
  r2: [
    { id: "1", from: "me", content: "Hi, I'm interested in renting a chair this weekend...", time: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: "2", from: "me", content: "I specialise in cuts and styling. Do you have backwash basins available?", time: new Date(Date.now() - 3 * 3600000 + 30000).toISOString() },
  ],
  r3: [
    { id: "1", from: "me", content: "Hi! I came across your Tuesday/Thursday listing and I'm very interested.", time: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: "2", from: "other", content: "Thanks for reaching out! Tell me a bit more about your experience?", time: new Date(Date.now() - 2.5 * 86400000).toISOString() },
    { id: "3", from: "me", content: "I've been freelancing for 4 years, mainly colour and cuts. Happy to share my portfolio.", time: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "4", from: "other", content: "We'd love to have you join our studio family!", time: new Date(Date.now() - 2 * 86400000 + 60000).toISOString() },
  ],
};

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
            <button onClick={() => router.push("/login")}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const convs = user.role === "venue" ? VENUE_CONVS : RENTER_CONVS;

  return (
    <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>
      <Navbar />
      <MessagingLayout convs={convs} userRole={user.role} />
    </div>
  );
}

// ─── Messaging Layout ─────────────────────────────────────────────────────────

type TabFilter = "all" | "active" | "inquiry" | "archived";

function MessagingLayout({ convs, userRole }: { convs: MockConv[]; userRole: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [filter, setFilter] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<MockMsg[]>([]);

  // When a conversation is selected, load its messages
  useEffect(() => {
    if (selectedId) {
      setMessages(MOCK_MESSAGES[selectedId] ?? []);
    }
  }, [selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowChat(true);
    // Mark as read locally
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setSelectedId(null);
  };

  const handleSend = (content: string) => {
    if (!selectedId) return;
    const msg: MockMsg = {
      id: `local-${Date.now()}`,
      from: "me",
      content,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const selectedConv = convs.find((c) => c.id === selectedId) ?? null;

  // Tab config per role
  const tabs: { label: string; value: TabFilter; count: number }[] =
    userRole === "venue"
      ? [
          { label: "All", value: "all", count: convs.length },
          { label: "Active Renters", value: "active", count: convs.filter((c) => c.category === "active").length },
          { label: "Inquiries", value: "inquiry", count: convs.filter((c) => c.category === "inquiry").length },
          { label: "Archived", value: "archived", count: convs.filter((c) => c.category === "archived").length },
        ]
      : [
          { label: "All", value: "all", count: convs.length },
          { label: "Active Bookings", value: "active", count: convs.filter((c) => c.category === "active").length },
          { label: "Inquiries", value: "inquiry", count: convs.filter((c) => c.category === "inquiry").length },
        ];

  // Filtered conversations
  const filtered = convs.filter((c) => {
    const matchesFilter = filter === "all" || c.category === filter;
    const matchesSearch =
      !search ||
      c.otherName.toLowerCase().includes(search.toLowerCase()) ||
      c.listingTitle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalUnread = convs.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-border bg-card ${
          mobileShowChat ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 shrink-0`}
      >
        {/* Sidebar header */}
        <div className="border-b border-border px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-muted">{totalUnread} unread</p>
              )}
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:border-primary hover:text-primary cursor-pointer"
              title="New message"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
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

        {/* Category tabs */}
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

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
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
            filtered.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isSelected={selectedId === conv.id}
                onSelect={() => handleSelect(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Chat panel ───────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col overflow-hidden ${
          !mobileShowChat && !selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedConv ? (
          <ChatPanel
            conv={selectedConv}
            messages={messages}
            onSend={handleSend}
            onBack={handleBack}
          />
        ) : (
          <EmptyPanel userRole={userRole} />
        )}
      </main>
    </div>
  );
}

// ─── Conversation item ────────────────────────────────────────────────────────

function ConvItem({
  conv,
  isSelected,
  onSelect,
}: {
  conv: MockConv;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const categoryDot: Record<ConvCategory, string> = {
    active: "bg-success",
    inquiry: "bg-warning",
    archived: "bg-muted/40",
  };
  const categoryLabel: Record<ConvCategory, string> = {
    active: "Active",
    inquiry: "Inquiry",
    archived: "Archived",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer border-b border-border/50 last:border-0 ${
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/10"
      } ${conv.unread > 0 ? "bg-primary/[0.03]" : ""}`}
    >
      {/* Avatar */}
      <div className="relative mt-0.5 shrink-0">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${conv.otherColor}`}>
          {conv.otherInitial}
        </div>
        {conv.online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <span className={`text-sm truncate leading-snug ${conv.unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
            {conv.otherName}
          </span>
          <span className="shrink-0 text-[10px] text-muted mt-0.5">{timeAgo(conv.lastTime)}</span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${categoryDot[conv.category]}`} />
          <span className="text-[10px] font-medium text-muted truncate">{conv.listingTitle}</span>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2">
          <p className={`text-xs truncate leading-snug ${conv.unread > 0 ? "font-medium text-foreground" : "text-muted"}`}>
            {conv.lastMessageMine && <span className="text-muted">You: </span>}
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {conv.unread}
            </span>
          )}
        </div>

        <div className="mt-1.5">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            conv.category === "active" ? "bg-success/10 text-success" :
            conv.category === "inquiry" ? "bg-warning/10 text-warning" :
            "bg-muted/20 text-muted"
          }`}>
            {categoryLabel[conv.category]}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  conv,
  messages,
  onSend,
  onBack,
}: {
  conv: MockConv;
  messages: MockMsg[];
  onSend: (content: string) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    onSend(content);
    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const categoryLabel: Record<ConvCategory, { label: string; color: string }> = {
    active: { label: "Active Booking", color: "text-success" },
    inquiry: { label: "Inquiry", color: "text-warning" },
    archived: { label: "Archived", color: "text-muted" },
  };
  const catInfo = categoryLabel[conv.category];

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shrink-0">
        {/* Back (mobile only) */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors cursor-pointer mr-1"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${conv.otherColor}`}>
            {conv.otherInitial}
          </div>
          {conv.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{conv.otherName}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${catInfo.color}`}>{catInfo.label}</span>
            <span className="text-muted text-xs">·</span>
            <span className="text-xs text-muted truncate">{conv.listingTitle}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {conv.category === "active" && (
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              View Booking
            </button>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:text-primary cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "thin" }}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${conv.otherColor}`}>
                {conv.otherInitial}
              </div>
              <p className="font-semibold text-foreground">{conv.otherName}</p>
              <p className="mt-1 text-xs text-muted">{conv.listingTitle}</p>
              <p className="mt-3 text-sm text-muted">No messages yet. Say hello!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, idx) => {
              const isMe = msg.from === "me";
              const prev = idx > 0 ? messages[idx - 1] : null;
              const next = idx < messages.length - 1 ? messages[idx + 1] : null;
              const isFirstInGroup = !prev || prev.from !== msg.from;
              const isLastInGroup = !next || next.from !== msg.from;
              const showTimestamp =
                !prev || new Date(msg.time).getTime() - new Date(prev.time).getTime() > 5 * 60000;

              return (
                <div key={msg.id}>
                  {showTimestamp && (
                    <p className="my-4 text-center text-[11px] font-medium text-muted/60">
                      {formatMsgTime(msg.time)}
                    </p>
                  )}
                  <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                    {/* Avatar (other side only, first in group) */}
                    <div className="w-7 shrink-0">
                      {!isMe && isLastInGroup && (
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${conv.otherColor}`}>
                          {conv.otherInitial}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[72%] px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-white"
                          : "bg-muted/15 text-foreground"
                      } ${
                        isMe
                          ? isFirstInGroup ? "rounded-2xl rounded-br-md" : isLastInGroup ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-r-md"
                          : isFirstInGroup ? "rounded-2xl rounded-bl-md" : isLastInGroup ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-l-md"
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

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          {/* Emoji button */}
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary/30 hover:text-primary cursor-pointer mb-0.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </button>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${conv.otherName}…`}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer mb-0.5 ${
              draft.trim()
                ? "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
                : "bg-muted/20 text-muted cursor-not-allowed"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted/40">Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}

// ─── Empty panel ──────────────────────────────────────────────────────────────

function EmptyPanel({ userRole }: { userRole: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background/50 px-6 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-10 w-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        {/* Decorative dots */}
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
      <div className="flex gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">S</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">J</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">E</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/20 text-xs font-bold text-muted">+</div>
      </div>
    </div>
  );
}
