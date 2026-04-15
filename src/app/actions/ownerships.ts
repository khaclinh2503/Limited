"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const IdsSchema = z.array(z.string().cuid());

export async function updateMyOwnerships(flowerTypeIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const ids = IdsSchema.parse(flowerTypeIds);
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.flowerOwnership.deleteMany({ where: { userId } });
    if (ids.length > 0) {
      await tx.flowerOwnership.createMany({
        data: ids.map((flowerTypeId) => ({ userId, flowerTypeId })),
      });
    }
  });

  revalidatePath("/stats");
  revalidatePath("/");
}
