import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getRole, saveAccess, clearAccess, type Role } from "./auth";

type AuthState = {
  role: Role | null;
  ready: boolean;
  canWrite: boolean;
  signIn: (role: Role, code?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getRole().then((r) => {
      setRole(r);
      setReady(true);
    });
  }, []);

  const signIn = useCallback(async (r: Role, code?: string) => {
    await saveAccess(r, code);
    setRole(r);
  }, []);

  const signOut = useCallback(async () => {
    await clearAccess();
    setRole(null);
  }, []);

  return (
    <Ctx.Provider
      value={{ role, ready, canWrite: role === "rodrigues", signIn, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
