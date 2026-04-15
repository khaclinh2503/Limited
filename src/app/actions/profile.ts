"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProfileSchema = z.object({
  ingameName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
  gameId: z.string().max(50).optional(),
  zalo: z.string().max(50).optional(),
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
    },
  });

  revalidatePath("/stats");
  revalidatePath("/");
}
