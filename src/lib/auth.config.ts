import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config (no Prisma, no Node.js-only modules)
// Used by middleware for lightweight route protection
export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: { signIn: "/sign-in" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/stats") ||
        nextUrl.pathname.startsWith("/admin");

      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
};
