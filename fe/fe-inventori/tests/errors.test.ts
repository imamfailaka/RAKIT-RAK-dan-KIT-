import { describe, it, expect } from "vitest";
import { ApiError, normalizeError } from "@/lib/errors";

describe("normalizeError", () => {
  it("maps 400 with field data to a validation error", () => {
    const e = normalizeError(new ApiError(400, { email: "email must be valid" }));
    expect(e.kind).toBe("validation");
    expect(e.fields).toEqual({ email: "email must be valid" });
  });
  it("maps 403 to a session error", () => {
    expect(normalizeError(new ApiError(403, null)).kind).toBe("session");
  });
  it("maps 404 to notfound", () => {
    expect(normalizeError(new ApiError(404, null)).kind).toBe("notfound");
  });
  it("translates a known 409 message", () => {
    const e = normalizeError(new ApiError(409, null, "equipment is already borrowed"));
    expect(e.kind).toBe("conflict");
    expect(e.message).toBe("Alat ini sedang dipinjam.");
  });
  it("maps 429 (too many login attempts) to a validation error carrying the wait message", () => {
    const e = normalizeError(new ApiError(429, { password: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." }, "too many login attempts"));
    expect(e.kind).toBe("validation");
    expect(e.fields?.password).toMatch(/15 menit/);
  });
  it("maps 500 to server", () => {
    expect(normalizeError(new ApiError(500, null)).kind).toBe("server");
  });
  it("maps a fetch TypeError to network", () => {
    expect(normalizeError(new TypeError("fetch failed")).kind).toBe("network");
  });
});
