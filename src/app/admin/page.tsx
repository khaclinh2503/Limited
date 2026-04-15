import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "@/components/AdminClient";
import { sortFlowersByQuality } from "@/lib/sort";

export const metadata: Metadata = {
  title: "Quản trị — Thành Hội: LIMITED",
};

export default async function AdminPage() {
  const [rawFlowers, users] = await Promise.all([
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
  ]);

  const flowers = sortFlowersByQuality(rawFlowers);
  return <AdminClient flowers={flowers} users={users} />;
}
