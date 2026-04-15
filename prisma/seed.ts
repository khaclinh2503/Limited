import { PrismaClient, Quality } from "@prisma/client";

const prisma = new PrismaClient();

// 32 hoa mẫu từ mockup
const seedFlowers: { name: string; quality: Quality; imageUrl?: string }[] = [
  // Đỏ (DO)
  { name: "Hoa hồng đỏ", quality: "DO", imageUrl: "https://placehold.co/200x200/E8341A/fff?text=🌹" },
  { name: "Hoa anh túc", quality: "DO", imageUrl: "https://placehold.co/200x200/E8341A/fff?text=🌺" },
  { name: "Hoa đỗ quyên đỏ", quality: "DO", imageUrl: "https://placehold.co/200x200/E8341A/fff?text=🌸" },
  { name: "Hoa lay ơn đỏ", quality: "DO", imageUrl: "https://placehold.co/200x200/E8341A/fff?text=🌷" },
  { name: "Hoa mào gà đỏ", quality: "DO", imageUrl: "https://placehold.co/200x200/C0392B/fff?text=🌻" },
  { name: "Hoa dã quỳ đỏ", quality: "DO", imageUrl: "https://placehold.co/200x200/C0392B/fff?text=✿" },

  // Cam (CAM)
  { name: "Hoa cúc vạn thọ", quality: "CAM", imageUrl: "https://placehold.co/200x200/F5A623/fff?text=🌼" },
  { name: "Hoa hướng dương", quality: "CAM", imageUrl: "https://placehold.co/200x200/F5A623/fff?text=🌻" },
  { name: "Hoa cúc cam", quality: "CAM", imageUrl: "https://placehold.co/200x200/F39C12/fff?text=🌺" },
  { name: "Hoa thược dược cam", quality: "CAM", imageUrl: "https://placehold.co/200x200/F39C12/fff?text=🌷" },
  { name: "Hoa rum cam", quality: "CAM", imageUrl: "https://placehold.co/200x200/E67E22/fff?text=🌸" },
  { name: "Hoa cẩm tú cầu cam", quality: "CAM", imageUrl: "https://placehold.co/200x200/E67E22/fff?text=✿" },

  // Tím (TIM)
  { name: "Hoa oải hương", quality: "TIM", imageUrl: "https://placehold.co/200x200/7C4DFF/fff?text=🌸" },
  { name: "Hoa violet", quality: "TIM", imageUrl: "https://placehold.co/200x200/7C4DFF/fff?text=🌺" },
  { name: "Hoa đỗ quyên tím", quality: "TIM", imageUrl: "https://placehold.co/200x200/9B59B6/fff?text=🌷" },
  { name: "Hoa cẩm tú cầu tím", quality: "TIM", imageUrl: "https://placehold.co/200x200/9B59B6/fff?text=🌼" },
  { name: "Hoa anh thảo tím", quality: "TIM", imageUrl: "https://placehold.co/200x200/8E44AD/fff?text=🌻" },
  { name: "Hoa loa kèn tím", quality: "TIM", imageUrl: "https://placehold.co/200x200/8E44AD/fff?text=✿" },

  // Xanh lá (XANH_LAC)
  { name: "Hoa trà xanh", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/00D68F/fff?text=🌸" },
  { name: "Hoa mộc lan xanh", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/00D68F/fff?text=🌺" },
  { name: "Hoa cỏ ba lá", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/27AE60/fff?text=🍀" },
  { name: "Hoa diếp cá", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/27AE60/fff?text=🌿" },
  { name: "Hoa bèo tây", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/1E8449/fff?text=🌱" },
  { name: "Hoa trúc đào xanh", quality: "XANH_LAC", imageUrl: "https://placehold.co/200x200/1E8449/fff?text=✿" },

  // Xanh lam (XANH_LAM)
  { name: "Hoa anh đào xanh", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/4A90D9/fff?text=🌸" },
  { name: "Hoa cúc biển", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/4A90D9/fff?text=🌼" },
  { name: "Hoa lưu ly", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/2980B9/fff?text=🌺" },
  { name: "Hoa chuông xanh", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/2980B9/fff?text=🔔" },
  { name: "Hoa đằng la xanh", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/1A6898/fff?text=🌷" },
  { name: "Hoa quỳnh xanh", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/1A6898/fff?text=🌻" },
  { name: "Hoa lô hội xanh", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/154360/fff?text=🌿" },
  { name: "Hoa băng tuyết", quality: "XANH_LAM", imageUrl: "https://placehold.co/200x200/154360/fff?text=❄" },
];

async function main() {
  console.log("🌸 Bắt đầu seed...");

  // Seed flower catalog
  let created = 0;
  for (const flower of seedFlowers) {
    await prisma.flowerType.upsert({
      where: { name_quality: { name: flower.name, quality: flower.quality } },
      update: {},
      create: flower,
    });
    created++;
  }

  console.log(`✅ Đã seed ${created} loại hoa.`);
  console.log(
    "ℹ️  Admin sẽ được promote tự động khi đăng nhập nếu email nằm trong ADMIN_EMAILS."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
