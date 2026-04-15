import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { OAuthConfig } from "next-auth/providers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      approved: boolean;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    id?: string;
    role?: Role;
    approved?: boolean;
  }
}

const GoogleOAuth: OAuthConfig<{
  sub: string;
  name: string;
  email: string;
  picture: string;
}> = {
  id: "google",
  name: "Google",
  type: "oauth",
  authorization: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    params: { scope: "openid email profile", response_type: "code" },
  },
  token: "https://oauth2.googleapis.com/token",
  userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
  issuer: "https://accounts.google.com",
  checks: ["pkce", "state"],
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
};

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [GoogleOAuth],
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const isAdmin = adminEmails.includes(user.email);

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, approved: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          let role: Role = dbUser.role;
          let approved = dbUser.approved;

          if (isAdmin) {
            // Admin email → auto promote + auto approve
            const updates: { role?: Role; approved?: boolean } = {};
            if (dbUser.role !== "ADMIN") updates.role = "ADMIN";
            if (!dbUser.approved) updates.approved = true;
            if (Object.keys(updates).length > 0) {
              await prisma.user.update({ where: { id: dbUser.id }, data: updates });
            }
            role = "ADMIN";
            approved = true;
          }

          token.role = role;
          token.approved = approved;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      session.user.role = (token.role as Role) ?? "MEMBER";
      session.user.approved = (token.approved as boolean) ?? false;
      return session;
    },
  },
});
