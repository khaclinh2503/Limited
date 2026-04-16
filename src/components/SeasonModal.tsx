"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSeasonResults } from "@/app/actions/seasons";

interface Props {
  open: boolean;
  onClose: () => void;
  season: string;
}

const TIER_COLOR: Record<string, string> = {
  D: "#8A8FA8",
  C: "#00D68F",
  B: "#4A90D9",
  A: "#7C4DFF",
  S: "#F5A623",
};

// 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_FULL   = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

// Mùa hoạt động: T3 (day=2) từ 9:00 → CN (day=0) đến 22:00
function isSeasonActive(d: Date): boolean {
  const day = d.getDay();
  const min = d.getHours() * 60 + d.getMinutes();
  if (day === 1) return false;                      // T2 — nghỉ
  if (day === 2 && min < 9 * 60) return false;      // T3 trước 9h — nghỉ
  if (day === 0 && min >= 22 * 60) return false;    // CN từ 22h — nghỉ
  return true;
}

function getNextEvent(now: Date): { label: string; target: Date } {
  const active = isSeasonActive(now);
  const day = now.getDay();
  const target = new Date(now);

  if (active) {
    // → mùa kết thúc CN 22:00
    const daysToSunday = day === 0 ? 0 : (7 - day) % 7;
    target.setDate(now.getDate() + daysToSunday);
    target.setHours(22, 0, 0, 0);
    return { label: "Kết thúc mùa sau", target };
  } else {
    // → mùa bắt đầu T3 9:00
    let daysToTue = 0;
    if (day === 0) daysToTue = 2;       // CN sau 22h → 2 ngày
    else if (day === 1) daysToTue = 1;  // T2 → 1 ngày
    // day=2 trước 9h → daysToTue = 0
    target.setDate(now.getDate() + daysToTue);
    target.setHours(9, 0, 0, 0);
    return { label: "Mùa tiếp theo bắt đầu sau", target };
  }
}

function formatCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SeasonModal({ open, onClose, season }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getSeasonResults>>>([]);

  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    getSeasonResults().then(setHistory);
    return () => clearInterval(id);
  }, [open]);

  // Đóng bằng Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const active    = now ? isSeasonActive(now) : false;
  const event     = now ? getNextEvent(now) : null;
  const remaining = event ? formatCountdown(event.target.getTime() - (now?.getTime() ?? 0)) : null;
  const todayDay  = now?.getDay() ?? -1;

  // Thứ tự hiển thị: T2 → CN (Mon → Sun)
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];

  function dayStatus(d: number): "active" | "rest" | "today" {
    const isActive = d !== 1; // tất cả trừ T2
    if (d === todayDay) return "today";
    return isActive ? "active" : "rest";
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-sm z-10"
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <div
                className="card-gradient space-y-5 overflow-y-auto"
                style={{ padding: "24px", maxHeight: "90dvh" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg leading-tight">Lịch mùa công hội</h2>
                    <p className="text-xs text-[var(--zps-text-secondary)] mt-0.5">{season}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)] transition-colors"
                    style={{ background: "var(--zps-bg-elevated)" }}
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={
                      active
                        ? { background: "rgba(0,214,143,0.15)", color: "#00D68F", border: "1px solid rgba(0,214,143,0.3)" }
                        : { background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: active ? "#00D68F" : "#F5A623",
                        animation: "bloomPulse 1.8s ease-in-out infinite",
                      }}
                    />
                    {active ? "Đang diễn ra" : "Đang nghỉ"}
                  </span>

                  {now && (
                    <span className="text-xs text-[var(--zps-text-secondary)]">
                      {DAY_FULL[now.getDay()]}, {pad(now.getHours())}:{pad(now.getMinutes())}
                    </span>
                  )}
                </div>

                {/* Countdown */}
                {remaining && event && (
                  <div
                    className="rounded-xl p-4 text-center space-y-1"
                    style={{ background: "var(--zps-bg-elevated)" }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-[var(--zps-text-secondary)]">
                      {event.label}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {remaining.d > 0 && (
                        <>
                          <CountUnit value={remaining.d} label="ngày" />
                          <Colon />
                        </>
                      )}
                      <CountUnit value={remaining.h} label="giờ" />
                      <Colon />
                      <CountUnit value={remaining.m} label="phút" />
                      <Colon />
                      <CountUnit value={remaining.s} label="giây" />
                    </div>
                  </div>
                )}

                {/* Week grid */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-[var(--zps-text-secondary)]">
                    Lịch tuần
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {weekOrder.map((d) => {
                      const status = dayStatus(d);
                      return (
                        <div key={d} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-[var(--zps-text-secondary)]">
                            {DAY_LABELS[d]}
                          </span>
                          <div
                            className="w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                            style={
                              status === "today"
                                ? {
                                    background: "var(--zps-brand-gradient)",
                                    color: "#fff",
                                    boxShadow: "0 0 12px rgba(245,166,35,0.5)",
                                  }
                                : d === 1
                                ? { background: "rgba(255,255,255,0.04)", color: "var(--zps-text-secondary)" }
                                : {
                                    background: "rgba(0,214,143,0.12)",
                                    color: "#00D68F",
                                    border: "1px solid rgba(0,214,143,0.2)",
                                  }
                            }
                          >
                            {status === "today" ? "•" : d === 1 ? "✕" : "✓"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule info */}
                <div
                  className="rounded-xl p-3 space-y-2 text-sm"
                  style={{ background: "var(--zps-bg-elevated)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--zps-text-secondary)]">Bắt đầu</span>
                    <span className="font-semibold" style={{ color: "#00D68F" }}>
                      Thứ 3 · 09:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--zps-text-secondary)]">Kết thúc</span>
                    <span className="font-semibold" style={{ color: "#F5A623" }}>
                      Chủ nhật · 22:00
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: "1px solid var(--zps-border-divider)" }}
                  >
                    <span className="text-[var(--zps-text-secondary)]">Nghỉ</span>
                    <span className="font-semibold text-[var(--zps-text-secondary)]">
                      Thứ 2 (cả ngày)
                    </span>
                  </div>
                </div>

                {/* Lịch sử mùa */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-[var(--zps-text-secondary)]">
                    Lịch sử giải đấu
                  </p>
                  <div className="space-y-1.5">
                    {history.slice().reverse().map((r) => (
                      <div
                        key={r.season}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: "var(--zps-bg-elevated)" }}
                      >
                        {/* Số mùa */}
                        <span className="text-xs font-bold text-[var(--zps-text-secondary)] w-10 shrink-0">
                          Mùa {r.season}
                        </span>

                        {/* Tier badge */}
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold shrink-0"
                          style={{
                            background: `${TIER_COLOR[r.tier]}22`,
                            color: TIER_COLOR[r.tier],
                            border: `1px solid ${TIER_COLOR[r.tier]}44`,
                          }}
                        >
                          Hạng {r.tier}
                        </span>

                        {/* Rank */}
                        <span className="text-base shrink-0">
                          {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                        </span>

                        {/* Điểm */}
                        <span className="ml-auto font-bold tabular-nums text-xs" style={{ color: "var(--zps-text-accent)" }}>
                          {r.points.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[40px]">
      <span
        className="text-2xl font-extrabold tabular-nums leading-none"
        style={{ color: "var(--zps-text-accent)" }}
      >
        {pad(value)}
      </span>
      <span className="text-[9px] text-[var(--zps-text-secondary)] mt-0.5">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <span
      className="text-xl font-bold mb-3 select-none"
      style={{ color: "var(--zps-text-secondary)" }}
    >
      :
    </span>
  );
}
