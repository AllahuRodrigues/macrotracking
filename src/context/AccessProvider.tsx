"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type AccessRole,
  canDelete,
  canWrite,
} from "@/lib/access";

interface AccessContextValue {
  role: AccessRole | null;
  ready: boolean;
  canWrite: boolean;
  canDelete: boolean;
  setGuest: () => Promise<void>;
  setRodrigues: (code: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AccessContext = createContext<AccessContextValue | null>(null);

async function fetchSession(): Promise<AccessRole | null> {
  try {
    const res = await fetch("/api/access", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.role === "guest" || data.role === "rodrigues") return data.role;
    return null;
  } catch {
    return null;
  }
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AccessRole | null>(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    const sessionRole = await fetchSession();
    setRole(sessionRole);
    return sessionRole;
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  // Keep tabs in sync when session changes elsewhere
  useEffect(() => {
    function onFocus() {
      refreshSession();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSession]);

  const applyRole = useCallback(async (next: AccessRole) => {
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ role: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Could not set access");
    }
    setRole(next);
  }, []);

  const setGuest = useCallback(async () => {
    await applyRole("guest");
  }, [applyRole]);

  const setRodrigues = useCallback(async (code: string) => {
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ role: "rodrigues", code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Invalid code" };
    }
    setRole("rodrigues");
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/access", { method: "DELETE", credentials: "same-origin" });
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      role,
      ready,
      canWrite: canWrite(role),
      canDelete: canDelete(role),
      setGuest,
      setRodrigues,
      signOut,
    }),
    [role, ready, setGuest, setRodrigues, signOut]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
