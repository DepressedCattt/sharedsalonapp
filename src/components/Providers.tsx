"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleMapsProvider } from "@/context/GoogleMapsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
