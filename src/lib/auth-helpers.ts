import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { forbidden } from "next/navigation";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function ensureApproved(userId: string, email: string) {
  // Admin email → tự động approve + promote ngay lập tức
  if (adminEmails.includes(email)) {
    await prisma.user.update({
      where: { id: userId },
      data: { approved: true, role: "ADMIN" },
    });
    return true;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { approved: true },
  });
  return dbUser?.approved ?? false;
}

export async function requireMember() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const approved = await ensureApproved(session.user.id, session.user.email);
  if (!approved) redirect("/pending");

  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const approved = await ensureApproved(session.user.id, session.user.email);
  if (!approved) redirect("/pending");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") forbidden();

  return session;
}
