import jwt from "jsonwebtoken";
import { env } from "./env";

/** admin = operasional penuh; manager = pengawas (lihat saja); technician = pinjam/kembali lewat scan. */
export type Role = "admin" | "manager" | "technician";
export const ROLES: Role[] = ["admin", "manager", "technician"];
export type TokenPayload = { id: string; role: Role };

export const signToken = (p: TokenPayload): string =>
  jwt.sign(p, env.SECRET, { expiresIn: "1h" });

/** Throws when the token is malformed, expired or signed with another secret. */
export function verifyToken(token: string): TokenPayload {
  const d = jwt.verify(token, env.SECRET) as any;
  if (!d?.id || !ROLES.includes(d.role)) throw new Error("invalid payload");
  return { id: String(d.id), role: d.role };
}
