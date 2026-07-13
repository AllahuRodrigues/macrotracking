"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Scale,
  Camera,
  BarChart3,
  Dumbbell,
  UserCircle,
  Pill,
  ClipboardList,
  LogOut,
  MoreHorizontal,
  X,
  Sparkles,
} from "lucide-react";
import { useAccess } from "@/context/AccessProvider";
import { roleLabel } from "@/lib/access";

const PRIMARY = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/meals", label: "Log", icon: UtensilsCrossed },
  { href: "/workout", label: "Train", icon: Dumbbell },
  { href: "/body", label: "Body", icon: Scale },
  { href: "/profile", label: "You", icon: UserCircle },
] as const;

const MORE = [
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/rituals", label: "Rituals", icon: Sparkles },
  { href: "/supplements", label: "Supps", icon: Pill },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/stats", label: "Stats", icon: BarChart3 },
] as const;

const DESKTOP = [...PRIMARY, ...MORE];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navigation() {
  const pathname = usePathname();
  const { role, signOut } = useAccess();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => isActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-[var(--foreground)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Dumbbell size={18} />
          </div>
          <span className="hidden xs:inline sm:inline">MacroTrack</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
          <nav className="flex flex-wrap items-center justify-end gap-0.5">
            {DESKTOP.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          {role && (
            <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-[var(--card-border)] pl-3">
              <span
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                  role === "rodrigues"
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "bg-[var(--accent-warm)]/20 text-[var(--accent-warm)]"
                }`}
              >
                {roleLabel(role)}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                title="Switch user"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {role && (
          <div className="flex items-center gap-2 md:hidden">
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                role === "rodrigues"
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "bg-[var(--accent-warm)]/20 text-[var(--accent-warm)]"
              }`}
            >
              {roleLabel(role)}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg p-2 text-[var(--muted)]"
              title="Switch user"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Phone: 5 big taps + More — fits iPhone 13 Pro */}
      <nav className="grid grid-cols-6 border-t border-[var(--card-border)] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[10px] font-semibold ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span className="leading-tight">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[10px] font-semibold ${
            moreActive || moreOpen ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <MoreHorizontal size={22} strokeWidth={moreActive ? 2.25 : 1.75} />
          <span className="leading-tight">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-[var(--muted)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-[56px] items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      active
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
