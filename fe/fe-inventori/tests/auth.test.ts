import { describe, it, expect, beforeEach } from "vitest";
import { decodeToken, isExpired, setToken, getToken, clearToken } from "@/lib/auth";
import { makeJwt } from "./helpers";

const future = Math.floor(Date.now() / 1000) + 3600;

describe("decodeToken", () => {
  it("returns id, role and exp for a valid JWT", () => {
    const t = makeJwt({ id: "u1", role: "admin", exp: future });
    expect(decodeToken(t)).toEqual({ id: "u1", role: "admin", exp: future });
  });
  it("returns null for a malformed token", () => {
    expect(decodeToken("not-a-jwt")).toBeNull();
  });
  it("returns null when the role is unknown", () => {
    expect(decodeToken(makeJwt({ id: "u1", role: "root", exp: future }))).toBeNull();
  });
});

describe("isExpired", () => {
  it("is true when exp is in the past", () => {
    expect(isExpired(makeJwt({ id: "u1", role: "technician", exp: 100 }), 200_000)).toBe(true);
  });
  it("is false when exp is in the future", () => {
    expect(isExpired(makeJwt({ id: "u1", role: "technician", exp: future }))).toBe(false);
  });
  it("is true for an undecodable token", () => {
    expect(isExpired("garbage")).toBe(true);
  });
});

describe("token cookie", () => {
  beforeEach(() => clearToken());
  it("stores and clears the token", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeUndefined();
  });
});
