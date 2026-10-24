export const TOKEN_COOKIE = "inventori_token";

export type Role = "admin" | "technician";
export type TokenPayload = { id: string; role: Role; exp: number };

export function decodeToken(token: string): TokenPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "="));
    const p = JSON.parse(json) as Partial<TokenPayload>;
    if (typeof p.id !== "string" || typeof p.exp !== "number") return null;
    if (p.role !== "admin" && p.role !== "technician") return null;
    return { id: p.id, role: p.role, exp: p.exp };
  } catch {
    return null;
  }
}

export function isExpired(token: string, now: number = Date.now()): boolean {
  const p = decodeToken(token);
  return !p || p.exp * 1000 <= now;
}

export const AUTH_EVENT = "inventori-auth";

const announce = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
};

export function subscribeAuth(cb: () => void): () => void {
  window.addEventListener(AUTH_EVENT, cb);
  return () => window.removeEventListener(AUTH_EVENT, cb);
}

export function setToken(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=3600; SameSite=Lax`;
  announce();
}

export function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(TOKEN_COOKIE.length + 1)) : undefined;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  announce();
}
