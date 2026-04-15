import { prisma } from "@/lib/prisma";
import { qualityOrder } from "@/lib/sort";

export async function getLeaderboard(limit = 10) {
  const users = await prisma.user.findMany({
    where: { approved: true },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      ingameName: true,
      bio: true,
      createdAt: true,
      _count: { select: { ownerships: true } },
    },
    orderBy: [
      { ownerships: { _count: "desc" } },
      { createdAt: "asc" },
    ],
    take: limit,
  });

  return users.map((u, i) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.image,
    ingameName: u.ingameName,
    bio: u.bio,
    totalFlowers: u._count.ownerships,
    rank: i + 1,
  }));
}

export async function getTotalMembers() {
  return prisma.user.count({ where: { approved: true } });
}

export async function getPlayerDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      ingameName: true,
      image: true,
      bio: true,
      gameId: true,
      ownerships: {
        select: {
          flowerType: {
            select: { id: true, name: true, quality: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  const topFlowers = user.ownerships
    .map((o) => o.flowerType)
    .sort((a, b) => qualityOrder[a.quality] - qualityOrder[b.quality])
    .slice(0, 10);

  return {
    id: user.id,
    name: user.name,
    ingameName: user.ingameName,
    image: user.image,
    bio: user.bio,
    gameId: user.gameId,
    totalFlowers: user.ownerships.length,
    topFlowers,
  };
}
