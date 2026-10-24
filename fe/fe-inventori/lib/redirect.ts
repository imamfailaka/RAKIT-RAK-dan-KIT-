import type { Role } from "@/lib/auth";

export const homeFor = (role: Role | undefined): string =>
  role === "admin" ? "/admin" : role === "technician" ? "/my/scan" : "/auth/login";

export function safeNext(next: string | null | undefined, role: Role | undefined): string {
  const fallback = homeFor(role);
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
