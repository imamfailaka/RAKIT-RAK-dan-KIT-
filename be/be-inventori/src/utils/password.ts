import crypto from "crypto";

const ITERATIONS = 120000;
const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, "sha512");
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}
