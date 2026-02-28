import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "venue" | "renter";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "venue" | "renter";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "venue" | "renter";
  }
}
