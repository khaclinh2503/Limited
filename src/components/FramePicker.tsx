"use client";

import { PlayerAvatar } from "@/components/PlayerAvatar";

interface FramePickerProps {
  availableFrames: string[];
  currentFrame: string | null;
  userImage: string | null;
  userName: string;
  onSelect: (frame: string | null) => void;
  disabled?: boolean;
}

export function FramePicker({
  availableFrames,
  currentFrame,
  userImage,
  userName,
  onSelect,
  disabled,
}: FramePickerProps) {
  return (
    <div
      className="grid grid-cols-4 gap-4"
      style={{ justifyItems: "center", padding: "12px" }}
    >
      {/* Ô không khung */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(null)}
        className="relative flex items-center justify-center rounded-2xl transition-all duration-150 disabled:opacity-50 overflow-visible"
        style={{
          width: 72,
          height: 72,
          border: currentFrame === null
            ? "2px solid #f97316"
            : "2px dashed rgba(255,255,255,0.2)",
          boxShadow: currentFrame === null
            ? "0 0 12px rgba(249,115,22,0.6)"
            : "none",
        }}
        title="Không khung"
      >
        <PlayerAvatar image={userImage} name={userName} frame={null} size={60} />
      </button>

      {/* Các khung */}
      {availableFrames.map((frameUrl) => {
        const isActive = currentFrame === frameUrl;
        return (
          <button
            key={frameUrl}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(frameUrl)}
            className="relative flex items-center justify-center rounded-2xl transition-all duration-150 disabled:opacity-50 overflow-visible"
            style={{
              width: 72,
              height: 72,
              border: isActive
                ? "2px solid #f97316"
                : "2px solid transparent",
              boxShadow: isActive
                ? "0 0 12px rgba(249,115,22,0.6)"
                : "none",
            }}
            title={frameUrl}
          >
            <PlayerAvatar image={userImage} name={userName} frame={frameUrl} size={60} />
          </button>
        );
      })}
    </div>
  );
}
