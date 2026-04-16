"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SeasonSchema = z.object({
  season: z.number().int().min(1),
  tier:   z.enum(["D", "C", "B", "A", "S"]),
  rank:   z.number().int().min(1),
  points: z.number().int().min(0),
});

export async function getSeasonResults() {
  return prisma.seasonResult.findMany({ orderBy: { season: "asc" } });
}

export async function upsertSeasonResult(data: {
  season: number;
  tier: string;
  rank: number;
  points: number;
}) {
  await requireAdmin();
  const parsed = SeasonSchema.parse(data);
  await prisma.seasonResult.upsert({
    where:  { season: parsed.season },
    update: parsed,
    create: parsed,
  });
  revalidatePath("/admin");
}

export async function deleteSeasonResult(season: number) {
  await requireAdmin();
  await prisma.seasonResult.delete({ where: { season } });
  revalidatePath("/admin");
}
