"use server";

import { prisma } from "@/lib/prisma";

export async function getPlayerFlowers(userId: string) {
  const [flowers, ownerships] = await Promise.all([
    prisma.flowerType.findMany({ orderBy: { name: "asc" } }),
    prisma.flowerOwnership.findMany({
      where: { userId },
      select: { flowerTypeId: true },
    }),
  ]);
  return {
    flowers,
    ownedFlowerIds: ownerships.map((o) => o.flowerTypeId),
  };
}
