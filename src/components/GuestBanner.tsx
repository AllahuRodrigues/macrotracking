"use client";

import { Eye } from "lucide-react";
import { useAccess } from "@/context/AccessProvider";

export function GuestBanner() {
  const { canWrite } = useAccess();
  if (canWrite) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--accent-warm)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
      <Eye size={16} className="shrink-0 text-[var(--accent-warm)]" />
      <span>Guest mode — view only. Sign in as Rodrigues to log and edit.</span>
    </div>
  );
}
