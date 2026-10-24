import jwt from "jsonwebtoken";
import { env } from "./env";

export type Role = "admin" | "technician";
export type TokenPayload = { id: string; role: Role };

export const signToken = (p: TokenPayload): string =>
  jwt.sign(p, env.SECRET, { expiresIn: "1h" });

/** Throws when the token is malformed, expired or signed with another secret. */
export function verifyToken(token: string): TokenPayload {
  const d = jwt.verify(token, env.SECRET) as any;
  if (!d?.id || (d.role !== "admin" && d.role !== "technician")) throw new Error("invalid payload");
  return { id: String(d.id), role: d.role };
}
