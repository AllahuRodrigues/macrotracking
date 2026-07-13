import * as SecureStore from "expo-secure-store";

const CODE_KEY = "macro_access_code";
const ROLE_KEY = "macro_access_role";

export type Role = "guest" | "rodrigues";

/** Persist the access code (used as the x-macro-access-code header). */
export async function saveAccess(role: Role, code?: string): Promise<void> {
  await SecureStore.setItemAsync(ROLE_KEY, role);
  if (role === "rodrigues" && code) {
    await SecureStore.setItemAsync(CODE_KEY, code);
  } else {
    await SecureStore.deleteItemAsync(CODE_KEY);
  }
}

export async function getRole(): Promise<Role | null> {
  const r = await SecureStore.getItemAsync(ROLE_KEY);
  return r === "guest" || r === "rodrigues" ? r : null;
}

export async function getAccessCode(): Promise<string | null> {
  return SecureStore.getItemAsync(CODE_KEY);
}

export async function clearAccess(): Promise<void> {
  await SecureStore.deleteItemAsync(ROLE_KEY);
  await SecureStore.deleteItemAsync(CODE_KEY);
}
