"use client";

import { useState, useTransition } from "react";
import { getPlayerDetailAction } from "@/app/actions/player";
import { PlayerModal } from "@/components/PlayerModal";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface LeaderboardEntry {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  frame: string | null;
  ingameName: string | null;
  totalFlowers: number;
  rank: number;
}

interface PlayerDetail {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  frame: string | null;
  bio: string | null;
  gameId: string | null;
  totalFlowers: number;
  topFlowers: {
    id: string;
    name: string;
    quality: import("@prisma/client").Quality;
    imageUrl: string | null;
  }[];
}

const RANK_BADGE: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankBadge(rank: number) {
  if (rank <= 3) return RANK_BADGE[rank];
  return rank.toString();
}

interface Props {
  data: LeaderboardEntry[];
  top1?: LeaderboardEntry;
}

export function LeaderboardClient({ data, top1 }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [, startTransition] = useTransition();

  function openPlayer(userId: string) {
    startTransition(async () => {
      const detail = await getPlayerDetailAction(userId);
      setSelectedPlayer(detail);
    });
  }

  const displayName = (entry: LeaderboardEntry) =>
    entry.ingameName ?? entry.name ?? entry.email.split("@")[0];

  return (
    <>
      {/* Rank #1 stat card */}
      {top1 && (
        <div
          className="card-gradient cursor-pointer rank-1-glow"
          onClick={() => openPlayer(top1.id)}
        >
          <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-3">
            🏆 Hạng #1
          </p>
          <div className="flex items-center gap-3">
            <PlayerAvatar
              image={top1.image}
              name={displayName(top1)}
              frame={top1.frame}
              size={52}
            />
            <div className="min-w-0">
              <p className="font-bold truncate">{displayName(top1)}</p>
              <p className="text-sm text-[var(--zps-brand-orange)] font-semibold">
                🌸 {top1.totalFlowers} loại hoa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BXH Table */}
      <div className="card-gradient !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Bảng xếp hạng</h2>
          <p className="text-xs text-[var(--zps-text-secondary)] mt-0.5">
            Top {data.length} thành viên · Click để xem chi tiết
          </p>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16 text-[var(--zps-text-secondary)]">
            <p className="text-4xl mb-3">🌱</p>
            <p>Chưa có thành viên nào</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.map((entry) => (
              <button
                key={entry.id}
                onClick={() => openPlayer(entry.id)}
                className="leaderboard-row w-full flex items-center gap-4 px-6 py-4 text-left"
              >
                {/* Rank */}
                <div
                  className={`w-9 text-center font-bold text-sm shrink-0 ${
                    entry.rank <= 3 ? "text-xl" : "text-[var(--zps-text-secondary)]"
                  }`}
                >
                  {rankBadge(entry.rank)}
                </div>

                {/* Avatar */}
                <PlayerAvatar
                  image={entry.image}
                  name={displayName(entry)}
                  frame={entry.frame}
                  size={44}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName(entry)}</p>
                  {entry.ingameName && (
                    <p className="text-xs text-[var(--zps-text-secondary)] truncate">
                      {entry.email.split("@")[0]}
                    </p>
                  )}
                </div>

                {/* Flower count */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--zps-brand-orange)]">
                    {entry.totalFlowers}
                  </p>
                  <p className="text-xs text-[var(--zps-text-secondary)]">loại hoa</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </>
  );
}

export type { LeaderboardEntry };
