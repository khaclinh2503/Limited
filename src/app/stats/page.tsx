import type { Metadata } from "next";
import { requireMember } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { StatsClient } from "@/components/StatsClient";
import { sortFlowersByQuality } from "@/lib/sort";
import { getAvailableFrames } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "Hoa của tôi — Thành Hội: LIMITED",
};

export default async function StatsPage() {
  const session = await requireMember();

  const [user, flowers, ownerships, availableFrames] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        ingameName: true,
        bio: true,
        gameId: true,
        zalo: true,
        frame: true,
      },
    }),
    prisma.flowerType.findMany({ orderBy: { name: "asc" } }),
    prisma.flowerOwnership.findMany({
      where: { userId: session.user.id },
      select: { flowerTypeId: true },
    }),
    getAvailableFrames(),
  ]);

  const ownedIds = ownerships.map((o) => o.flowerTypeId);

  return (
    <StatsClient
      user={user}
      flowers={sortFlowersByQuality(flowers)}
      ownedFlowerIds={ownedIds}
      availableFrames={availableFrames}
    />
  );
}
