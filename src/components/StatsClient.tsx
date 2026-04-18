"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/actions/profile";
import { FlowerGrid } from "@/components/FlowerGrid";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { FramePicker } from "@/components/FramePicker";
import type { Quality } from "@prisma/client";

interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  ingameName: string | null;
  bio: string | null;
  gameId: string | null;
  zalo: string | null;
  frame: string | null;
}

interface Flower {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
}

interface Props {
  user: UserProfile | null;
  flowers: Flower[];
  ownedFlowerIds: string[];
  availableFrames: string[];
}

export function StatsClient({ user, flowers, ownedFlowerIds, availableFrames }: Props) {
  const [form, setForm] = useState({
    ingameName: user?.ingameName ?? "",
    bio: user?.bio ?? "",
    gameId: user?.gameId ?? "",
    zalo: user?.zalo ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"flowers" | "profile">("flowers");
  const [currentFrame, setCurrentFrame] = useState<string | null>(user?.frame ?? null);
  const [showFramePicker, setShowFramePicker] = useState(false);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function saveProfile() {
    startTransition(async () => {
      try {
        await updateMyProfile(form);
        showToast("Đã lưu thông tin cá nhân! ✨", true);
      } catch {
        showToast("Lưu thất bại, thử lại nhé!", false);
      }
    });
  }

  function saveFrame(frame: string | null) {
    const previousFrame = currentFrame;
    setCurrentFrame(frame);
    setShowFramePicker(false);
    startTransition(async () => {
      try {
        await updateMyProfile({ frame });
        showToast("Đã cập nhật khung! ✨", true);
      } catch {
        showToast("Lưu thất bại, thử lại nhé!", false);
        setCurrentFrame(previousFrame);
      }
    });
  }

  const displayName = user?.ingameName ?? user?.name ?? user?.email?.split("@")[0] ?? "Thành viên";

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Title */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">Bộ sưu tập của tôi</h1>
      </div>

      {/* Tab bar — mobile only */}
      <div className="flex lg:hidden gap-2 shrink-0">
        {(["flowers", "profile"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeTab === tab
                ? "bg-[var(--zps-bg-elevated)] text-[var(--zps-text-primary)]"
                : "text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)]"
            }`}
          >
            {tab === "flowers" ? "🌸 Hoa của tôi" : "👤 Hồ sơ"}
          </button>
        ))}
      </div>

      {/* 2-column layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Cột trái: Profile ── */}
        <div className={`card-gradient flex flex-col gap-4 overflow-y-auto ${activeTab === "profile" ? "flex" : "hidden"} lg:flex`}>
          {/* Avatar — click để chọn khung */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/10">
            <button
              type="button"
              onClick={() => availableFrames.length > 0 && setShowFramePicker(true)}
              className="relative group"
              title="Nhấn để chọn khung avatar"
            >
              <PlayerAvatar
                image={user?.image ?? null}
                name={displayName}
                frame={currentFrame}
                size={80}
              />
              {availableFrames.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/40 transition-all duration-150">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold transition-all duration-150 drop-shadow">
                    🖼️ Đổi khung
                  </span>
                </div>
              )}
            </button>
            <div className="text-center">
              <p className="font-semibold">{displayName}</p>
              <p className="text-xs text-[var(--zps-text-secondary)]">{user?.email}</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--zps-text-secondary)] mb-1.5 uppercase tracking-wider">
                Tên trong game
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Tên hiển thị trên BXH"
                value={form.ingameName}
                onChange={(e) => setForm((f) => ({ ...f, ingameName: e.target.value }))}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--zps-text-secondary)] mb-1.5 uppercase tracking-wider">
                Tiểu sử
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Giới thiệu bản thân..."
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                maxLength={200}
              />
              <p className="text-xs text-[var(--zps-text-secondary)] mt-1 text-right">
                {form.bio.length}/200
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--zps-text-secondary)] mb-1.5 uppercase tracking-wider">
                ID trò chơi
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="VD: 123456789"
                value={form.gameId}
                onChange={(e) => setForm((f) => ({ ...f, gameId: e.target.value }))}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--zps-text-secondary)] mb-1.5 uppercase tracking-wider">
                Zalo
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Số điện thoại Zalo"
                value={form.zalo}
                onChange={(e) => setForm((f) => ({ ...f, zalo: e.target.value }))}
                maxLength={50}
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={isPending}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Đang lưu..." : "💾 Lưu thông tin"}
          </button>
        </div>

        {/* ── Cột phải: Flower grid ── */}
        <div className={`lg:col-span-2 card-gradient flex flex-col ${activeTab === "flowers" ? "flex" : "hidden"} lg:flex`}>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="font-bold text-lg">Hoa đang sở hữu</h2>
              <p className="text-xs text-[var(--zps-text-secondary)]">
                Chọn các hoa bạn đang có trong game
              </p>
            </div>
            <span className="text-2xl">🌸</span>
          </div>
          <FlowerGrid flowers={flowers} ownedFlowerIds={ownedFlowerIds} />
        </div>
      </div>

      {/* Frame picker modal */}
      {showFramePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowFramePicker(false)}
        >
          <div
            className="rounded-2xl w-full max-w-md flex flex-col"
            style={{
              background: "linear-gradient(160deg, #1a1035 0%, #0f0a1e 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fixed */}
            <div
              className="flex items-center justify-between shrink-0"
              style={{ padding: "20px 24px 12px" }}
            >
              <h3 className="font-bold text-lg">Chọn khung avatar</h3>
              <button
                onClick={() => setShowFramePicker(false)}
                className="text-[var(--zps-text-secondary)] hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Preview lớn — fixed */}
            <div
              className="flex justify-center shrink-0"
              style={{ padding: "16px 0 12px" }}
            >
              <PlayerAvatar
                image={user?.image ?? null}
                name={displayName}
                frame={currentFrame}
                size={96}
              />
            </div>

            {/* Grid khung — scroll dọc, padding rộng để frame không bị clip */}
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                flex: "1 1 auto",
                minHeight: 0,
              }}
            >
              <FramePicker
                availableFrames={availableFrames}
                currentFrame={currentFrame}
                userImage={user?.image ?? null}
                userName={displayName}
                onSelect={saveFrame}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background: toast.ok ? "var(--zps-accent-green)" : "#E8341A",
            color: "#fff",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
