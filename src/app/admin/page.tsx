import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "@/components/AdminClient";
import { sortFlowersByQuality } from "@/lib/sort";

export const metadata: Metadata = {
  title: "Quản trị — Thành Hội: LIMITED",
};

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [rawFlowers, users, seasons] = await Promise.all([
    prisma.flowerType.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { ownerships: true } } },
    }),
    prisma.user.findMany({
      orderBy: [{ approved: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { ownerships: true } },
        ownerships: { select: { flowerTypeId: true } },
      },
    }),
    prisma.seasonResult.findMany({ orderBy: { season: "asc" } }),
  ]);

  const flowers = sortFlowersByQuality(rawFlowers);
  return <AdminClient flowers={flowers} users={users} seasons={seasons} isAdmin={isAdmin} />;
}
