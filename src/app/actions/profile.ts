"use server";

import { readdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProfileSchema = z.object({
  ingameName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
  gameId: z.string().max(50).optional(),
  zalo: z.string().max(50).optional(),
  frame: z
    .string()
    .regex(/^\/frame\/\d+\.png$/)
    .nullable()
    .optional(),
});

export async function updateMyProfile(data: z.infer<typeof ProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const parsed = ProfileSchema.parse(data);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ingameName: parsed.ingameName?.trim() || null,
      bio: parsed.bio?.trim() || null,
      gameId: parsed.gameId?.trim() || null,
      zalo: parsed.zalo?.trim() || null,
      frame: parsed.frame ?? undefined,
    },
  });

  revalidatePath("/stats");
  revalidatePath("/");
}

export async function getAvailableFrames(): Promise<string[]> {
  try {
    const dir = join(process.cwd(), "public", "frame");
    const files = await readdir(dir);
    return files
      .filter((f) => /^\d+\.png$/.test(f))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((f) => `/frame/${f}`);
  } catch {
    return [];
  }
}
