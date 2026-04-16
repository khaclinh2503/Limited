"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const current = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
    setTheme(stored ?? current ?? "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  // Tránh hydration mismatch — render placeholder cùng kích thước
  if (!mounted) {
    return <div className="w-14 h-7 rounded-full shrink-0" style={{ background: "var(--zps-bg-elevated)" }} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="relative w-14 h-7 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zps-brand-orange)]"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1C2040, #2E3148)"
          : "linear-gradient(135deg, #FFB6D9, #FF85B3, #E879A0)",
        border: "1.5px solid",
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(220,60,120,0.30)",
        boxShadow: isDark
          ? "0 0 10px rgba(124, 77, 255, 0.3)"
          : "0 0 14px rgba(255, 80, 140, 0.40)",
        transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Icons cố định trên track */}
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none pointer-events-none"
        style={{ opacity: isDark ? 1 : 0.4, transition: "opacity 0.3s" }}
      >
        🌙
      </span>
      <span
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none pointer-events-none"
        style={{ opacity: isDark ? 0.4 : 1, transition: "opacity 0.3s" }}
      >
        ☀️
      </span>

      {/* Thumb */}
      <span
        className="absolute top-[2px] w-[22px] h-[22px] rounded-full"
        style={{
          left: isDark ? "2px" : "calc(100% - 24px)",
          background: isDark
            ? "linear-gradient(135deg, #7C4DFF, #4A90D9)"
            : "linear-gradient(135deg, #FF4DA6, #C026D3)",
          boxShadow: isDark
            ? "0 2px 8px rgba(124,77,255,0.6)"
            : "0 2px 8px rgba(255,77,166,0.65)",
          transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, box-shadow 0.3s ease",
        }}
      />
    </button>
  );
}
