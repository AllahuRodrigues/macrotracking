"use client";

import { useState } from "react";
import { Lock, Eye, User } from "lucide-react";
import { useAccess } from "@/context/AccessProvider";
import { Button, Input } from "./ui";

type Step = "choose" | "code";

export function AccessGate() {
  const { role, ready, setGuest, setRodrigues } = useAccess();
  const [step, setStep] = useState<Step>("choose");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) return null;
  if (role) return null;

  async function handleGuest() {
    setLoading(true);
    setError(null);
    try {
      await setGuest();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRodrigues(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await setRodrigues(code.trim());
    if (!result.ok) {
      setError(result.error ?? "Invalid code");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Welcome to MacroTrack</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Who&apos;s viewing today?
          </p>
        </div>

        {step === "choose" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setStep("code")}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
                <User size={20} />
              </div>
              <div>
                <p className="font-semibold">Rodrigues</p>
                <p className="text-xs text-[var(--muted)]">Full access — log, edit & delete</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--accent-warm)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warm)]/20 text-[var(--accent-warm)]">
                <Eye size={20} />
              </div>
              <div>
                <p className="font-semibold">Guest</p>
                <p className="text-xs text-[var(--muted)]">View only — no edits or uploads</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleRodrigues} className="space-y-4">
            <Input
              label="Access code"
              type="password"
              inputMode="numeric"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !code.trim()} className="flex-1">
                {loading ? "Unlocking…" : "Unlock"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setStep("choose"); setError(null); setCode(""); }}>
                Back
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
