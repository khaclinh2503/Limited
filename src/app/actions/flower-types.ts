"use server";

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
  imageUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
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
