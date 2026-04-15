"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Không có quyền thực hiện");
  }
  return session;
}

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { approved: true } });
  revalidatePath("/admin");
}

export async function updateUserRole(
  userId: string,
  role: "MEMBER" | "ADMIN"
) {
  const session = await requireAdmin();
  if (userId === session.user.id) throw new Error("Không thể đổi role của chính mình");

  z.enum(["MEMBER", "ADMIN"]).parse(role);

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();
  if (userId === session.user.id) throw new Error("Không thể xóa chính mình");

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin");
  revalidatePath("/");
}
