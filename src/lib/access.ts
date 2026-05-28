export type AccessRole = "guest" | "rodrigues";

export const ACCESS_COOKIE = "macro_access";
export const RODRIGUES_CODE = "2003";

export function canWrite(role: AccessRole | null): boolean {
  return role === "rodrigues";
}

export function canDelete(role: AccessRole | null): boolean {
  return role === "rodrigues";
}

export function roleLabel(role: AccessRole | null): string {
  if (role === "rodrigues") return "Rodrigues";
  if (role === "guest") return "Guest";
  return "";
}
