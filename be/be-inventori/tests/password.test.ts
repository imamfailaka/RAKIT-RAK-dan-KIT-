import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password";

describe("password", () => {
  it("produces a different hash for the same password (per-user salt)", () => {
    expect(hashPassword("Rahasia123")).not.toBe(hashPassword("Rahasia123"));
  });
  it("verifies the right password and rejects a wrong one", () => {
    const h = hashPassword("Rahasia123");
    expect(verifyPassword("Rahasia123", h)).toBe(true);
    expect(verifyPassword("salah", h)).toBe(false);
  });
  it("rejects a malformed stored value instead of throwing", () => {
    expect(verifyPassword("x", "bukan-hash")).toBe(false);
  });
});
