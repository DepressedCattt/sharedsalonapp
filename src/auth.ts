import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

const devPersonas: Record<
  string,
  { id: string; name: string; email: string; image: null; role?: "venue" | "renter" }
> = {
  "dev-venue": {
    id: "dev-venue-001",
    name: "Dev Venue Owner",
    email: "dev-venue@sharedsalon.dev",
    image: null,
    role: "venue",
  },
  "dev-renter": {
    id: "dev-renter-001",
    name: "Dev Freelancer",
    email: "dev-renter@sharedsalon.dev",
    image: null,
    role: "renter",
  },
  "dev-new": {
    id: "dev-new-001",
    name: "New Dev User",
    email: "dev-new@sharedsalon.dev",
    image: null,
    // no role — will go through the role-selection screen
  },
};

const devProvider =
  process.env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "dev",
          name: "Dev Login",
          credentials: {
            persona: { label: "Persona", type: "text" },
          },
          async authorize(credentials) {
            const persona = devPersonas[credentials?.persona as string];
            return persona ?? null;
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      authorization: {
        params: {
          scope: "email,public_profile",
        },
      },
    }),
    ...devProvider,
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, trigger, session, user }) {
      // On initial sign-in via credentials, carry the role from the persona
      if (user?.role) {
        token.role = user.role;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as "venue" | "renter" | undefined;
      return session;
    },
  },
});
