import type { Metadata } from "next";
import { Suspense } from "react";
import { getLeaderboard, getTotalMembers } from "@/lib/queries";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Bảng xếp hạng — Thành Hội: LIMITED",
};

// Mùa 1 bắt đầu T3 ngày 10/3/2026 — mỗi tuần T3→CN là 1 mùa
const SEASON_START = new Date(2026, 2, 10, 9, 0, 0); // 10/03/2026 09:00

function getCurrentSeason() {
  const now = new Date();
  const ms = now.getTime() - SEASON_START.getTime();
  const season = Math.max(1, Math.floor(ms / 604_800_000) + 1);
  return `🌸 Mùa ${season}`;
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
