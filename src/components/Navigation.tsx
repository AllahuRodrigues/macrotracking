"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAccess } from "@/context/AccessProvider";
import { roleLabel } from "@/lib/access";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/supplements", label: "Supps", icon: Pill },
  { href: "/body", label: "Body", icon: Scale },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function Navigation() {
  const pathname = usePathname();
  const { role, signOut } = useAccess();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-[var(--foreground)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Dumbbell size={18} />
          </div>
          <span>MacroTrack</span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
          {role && (
            <div className="ml-2 flex items-center gap-2 border-l border-[var(--card-border)] pl-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
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
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                title="Switch user"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex justify-around border-t border-[var(--card-border)] px-2 py-1.5 sm:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
