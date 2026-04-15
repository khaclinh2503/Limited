import type { Metadata } from "next";
import { Suspense } from "react";
import { getLeaderboard, getTotalMembers } from "@/lib/queries";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Bảng xếp hạng — Thành Hội: LIMITED",
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "🌸 Mùa Xuân";
  if (month >= 6 && month <= 8) return "☀️ Mùa Hè";
  if (month >= 9 && month <= 11) return "🍂 Mùa Thu";
  return "❄️ Mùa Đông";
}

async function DashboardContent() {
  const [leaderboard, totalMembers] = await Promise.all([
    getLeaderboard(10),
    getTotalMembers(),
  ]);

  return (
    <DashboardClient
      leaderboard={leaderboard}
      totalMembers={totalMembers}
      season={getCurrentSeason()}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[var(--zps-text-secondary)] text-center">
            <p className="text-4xl mb-3 animate-bounce">🌸</p>
            <p>Đang tải...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
