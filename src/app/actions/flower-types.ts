"use server";

import { readdir } from "fs/promises";
import { join } from "path";
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

const FlowerSchema = z.object({
  name: z.string().min(1, "Tên không được trống").max(100),
  quality: z.enum(["DO", "CAM", "TIM", "XANH_LAC", "XANH_LAM"]),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
});

export async function createFlowerType(data: z.infer<typeof FlowerSchema>) {
  await requireAdmin();
  const parsed = FlowerSchema.parse(data);

  await prisma.flowerType.create({
    data: {
      name: parsed.name,
      quality: parsed.quality,
      imageUrl: parsed.imageUrl || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/stats");
}

export async function updateFlowerType(
  id: string,
  data: z.infer<typeof FlowerSchema>
) {
  await requireAdmin();
  const parsed = FlowerSchema.parse(data);

  await prisma.flowerType.update({
    where: { id },
    data: {
      name: parsed.name,
      quality: parsed.quality,
      imageUrl: parsed.imageUrl || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/stats");
}

export async function deleteFlowerType(id: string) {
  await requireAdmin();

  await prisma.flowerType.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/stats");
  revalidatePath("/");
}

export async function getUnmappedFlowerImages(): Promise<string[]> {
  await requireAdmin();
  try {
    const dir = join(process.cwd(), "public", "flowers");
    const files = await readdir(dir);
    const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    const mapped = await prisma.flowerType.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    const mappedSet = new Set(mapped.map((f) => f.imageUrl));

    return imageFiles
      .filter((f) => !mappedSet.has(`/flowers/${f}`))
      .map((f) => `/flowers/${f}`)
      .sort();
  } catch {
    return [];
  }
}

export async function getFlowerOwners(flowerTypeId: string) {
  const ownerships = await prisma.flowerOwnership.findMany({
    where: { flowerTypeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          ingameName: true,
          image: true,
        },
      },
    },
    orderBy: { user: { ingameName: "asc" } },
  });
  return ownerships.map((o) => o.user);
}
