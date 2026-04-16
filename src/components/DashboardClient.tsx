"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { getPlayerDetailAction } from "@/app/actions/player";
import { PlayerModal } from "@/components/PlayerModal";
import { SeasonModal } from "@/components/SeasonModal";
import type { Quality } from "@prisma/client";

interface LeaderboardEntry {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  ingameName: string | null;
  bio: string | null;
  totalFlowers: number;
  rank: number;
}

interface PlayerDetail {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  bio: string | null;
  gameId: string | null;
  totalFlowers: number;
  topFlowers: { id: string; name: string; quality: Quality; imageUrl: string | null }[];
}

interface Props {
  leaderboard: LeaderboardEntry[];
  totalMembers: number;
  season: string;
}

const RANK_BADGE: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function displayName(entry: LeaderboardEntry) {
  return entry.ingameName ?? entry.name ?? entry.email.split("@")[0];
}

export function DashboardClient({ leaderboard, totalMembers, season }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [, startTransition] = useTransition();

  const top1 = leaderboard[0] ?? null;

  function openPlayer(userId: string) {
    setLoadingId(userId);
    startTransition(async () => {
      const detail = await getPlayerDetailAction(userId);
      setSelectedPlayer(detail);
      setLoadingId(null);
    });
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Title ── */}
      <div className="text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gradient">
          Thành Hội: LIMITED
        </h1>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {/* Tổng thành viên */}
        <div className="card-gradient text-center !py-3">
          <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-1">
            👥 Thành viên
          </p>
          <p className="text-3xl font-extrabold text-gradient">{totalMembers}</p>
          <p className="text-xs text-[var(--zps-text-secondary)]">trong công hội</p>
        </div>

        {/* Mùa hiện tại — clickable */}
        <button
          onClick={() => setSeasonOpen(true)}
          className="card-gradient text-center !py-3 w-full group transition-transform hover:-translate-y-1"
        >
          <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-1">
            📅 Mùa hiện tại
          </p>
          <p className="text-xl font-bold">{season}</p>
          <p className="text-xs mt-1 transition-colors" style={{ color: "var(--zps-brand-orange)" }}>
            Xem lịch mùa →
          </p>
        </button>

        {/* Hạng #1 */}
        {top1 ? (
          <button
            onClick={() => openPlayer(top1.id)}
            className="card-gradient rank-1-glow text-left w-full !py-3"
          >
            <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-2">
              🏆 Hạng #1
            </p>
            <div className="flex items-center gap-3">
              {top1.image ? (
                <Image
                  src={top1.image}
                  alt={displayName(top1)}
                  width={52}
                  height={52}
                  className="rounded-full ring-2 ring-[var(--zps-brand-orange)]"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center font-bold text-lg shrink-0">
                  {displayName(top1)[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold truncate">{displayName(top1)}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--zps-brand-orange)" }}>
                  🌸 {top1.totalFlowers} loại hoa
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div className="card-gradient text-center">
            <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-2">
              🏆 Hạng #1
            </p>
            <p className="text-[var(--zps-text-secondary)] text-sm">Chưa có dữ liệu</p>
          </div>
        )}
      </div>

      {/* ── Bảng xếp hạng ── */}
      <div className="card-gradient !p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-white/10 shrink-0">
          <h2 className="font-bold text-lg">Bảng xếp hạng</h2>
          <p className="text-xs text-[var(--zps-text-secondary)] mt-0.5">
            Top {leaderboard.length} thành viên · Click để xem chi tiết
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-[var(--zps-text-secondary)]">
            <p className="text-4xl mb-3">🌱</p>
            <p>Chưa có thành viên nào trong bảng xếp hạng</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {leaderboard.map((entry) => (
              <button
                key={entry.id}
                onClick={() => openPlayer(entry.id)}
                disabled={loadingId === entry.id}
                className="leaderboard-row w-full flex items-center gap-4 px-6 py-4 text-left disabled:opacity-60"
              >
                {/* Rank badge */}
                <div
                  className={`w-9 text-center font-bold shrink-0 ${
                    entry.rank <= 3 ? "text-2xl" : "text-sm text-[var(--zps-text-secondary)]"
                  }`}
                >
                  {entry.rank <= 3 ? RANK_BADGE[entry.rank] : entry.rank}
                </div>

                {/* Avatar */}
                {entry.image ? (
                  <Image
                    src={entry.image}
                    alt={displayName(entry)}
                    width={40}
                    height={40}
                    className="rounded-full shrink-0"
                    style={
                      entry.rank === 1
                        ? { outline: "2px solid var(--zps-brand-orange)", outlineOffset: "2px" }
                        : {}
                    }
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center text-sm font-bold shrink-0">
                    {displayName(entry)[0].toUpperCase()}
                  </div>
                )}

                {/* Tên */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName(entry)}</p>
                  {entry.bio ? (
                    <p className="text-xs text-[var(--zps-text-secondary)] truncate italic">
                      {entry.bio}
                    </p>
                  ) : entry.ingameName ? (
                    <p className="text-xs text-[var(--zps-text-secondary)] truncate">
                      {entry.email.split("@")[0]}
                    </p>
                  ) : null}
                </div>

                {/* Số hoa */}
                <div className="text-right shrink-0">
                  {loadingId === entry.id ? (
                    <span className="text-xs text-[var(--zps-text-secondary)]">...</span>
                  ) : (
                    <>
                      <p className="font-bold" style={{ color: "var(--zps-brand-orange)" }}>
                        {entry.totalFlowers}
                      </p>
                      <p className="text-xs text-[var(--zps-text-secondary)]">loại hoa</p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <PlayerModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
      <SeasonModal
        open={seasonOpen}
        onClose={() => setSeasonOpen(false)}
        season={season}
      />
    </div>
  );
}
