"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavProps {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: Role;
  } | null;
}

const navLinks = [
  { href: "/", label: "Bảng xếp hạng", icon: "🏆" },
  { href: "/stats", label: "Hoa của tôi", icon: "🌸", requireAuth: true },
  { href: "/admin", label: "Quản trị", icon: "⚙️", requireAdmin: true },
];

export function Navigation({ user }: NavProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const visibleLinks = navLinks.filter((link) => {
    if (link.requireAdmin && user?.role !== "ADMIN") return false;
    if (link.requireAuth && !user) return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-40 w-full">
      <div
        className="mx-auto flex items-center justify-between px-4 py-3 max-w-5xl"
        style={{
          background: "var(--zps-nav-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--zps-nav-border)",
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🌸</span>
          <span className="font-bold text-sm sm:text-base text-gradient">
            <span className="hidden sm:inline">Thành Hội: </span>LIMITED
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {visibleLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    active
                      ? "bg-[var(--zps-bg-elevated)] text-[var(--zps-text-primary)]"
                      : "text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)] hover:bg-[var(--zps-overlay)]"
                  }`}
              >
                <span>{link.icon}</span>
                <span className="hidden sm:inline ml-1">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Auth area */}
        <div className="relative shrink-0">
          {user ? (
            <>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--zps-overlay)] transition-colors"
                aria-label="Tài khoản"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "avatar"}
                    width={36}
                    height={36}
                    className="rounded-full ring-2 ring-[var(--zps-brand-orange)]/60"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center text-sm font-bold">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  {/* Dropdown */}
                  <div
                    className="absolute right-0 top-12 z-50 min-w-[200px] rounded-xl p-2 space-y-1"
                    style={{
                      background: "var(--zps-bg-elevated)",
                      border: "1px solid var(--zps-border)",
                      boxShadow: "0 8px 32px var(--zps-dropdown-shadow)",
                    }}
                  >
                    <div className="px-3 py-2 mb-1" style={{ borderBottom: "1px solid var(--zps-border-divider)" }}>
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-[var(--zps-text-secondary)] truncate">
                        {user.email}
                      </p>
                    </div>
                    <form
                      action="/api/auth/signout"
                      method="POST"
                      onSubmit={() => setDropdownOpen(false)}
                    >
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link
              href="/sign-in"
              className="btn-primary py-2 px-4 text-sm rounded-lg"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
