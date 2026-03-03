"use client";

import { useAuth } from "@/context/AuthContext";

export default function MessagesPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background/50 px-6 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            className="h-10 w-10 text-primary/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </div>
        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary/20" />
        <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-accent/30" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Your messages</h2>
        <p className="mt-1 max-w-xs text-sm text-muted">
          Select a conversation on the left to start chatting, or browse{" "}
          {user?.role === "venue" ? "your listings" : "available chairs"} to connect with{" "}
          {user?.role === "venue" ? "freelancers" : "venues"}.
        </p>
      </div>
    </div>
  );
}
