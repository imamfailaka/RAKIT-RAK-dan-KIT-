import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, getMe } from "@/services/auth";
import { normalizeError } from "@/lib/errors";

const respond = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );

const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return normalizeError(e);
  }
  throw new Error("expected the call to fail");
};

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_API_URL = "http://api.test/api";
});

describe("auth service", () => {
  it("login sends email and password and returns the token string", async () => {
    const spy = respond({ meta: { status: 200, message: "login success" }, data: "jwt-token" });
    await expect(login("a@b.c", "Passw0rd")).resolves.toBe("jwt-token");
    expect(JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)).toEqual({ email: "a@b.c", password: "Passw0rd" });
  });
  it("login surfaces a wrong-credentials 400 as a field message", async () => {
    respond({ meta: { status: 400, message: "failed to login" }, data: { password: "Email atau password salah" } }, 400);
    const err = await failure(login("a@b.c", "x"));
    expect(err).toMatchObject({ kind: "validation", fields: { password: "Email atau password salah" } });
  });
  it("login treats an inactive account (403) as a session-kind error", async () => {
    respond({ meta: { status: 403, message: "account is not active" }, data: null }, 403);
    const err = await failure(login("a@b.c", "x"));
    expect(err.kind).toBe("session");
  });
  it("getMe sends the bearer token", async () => {
    const spy = respond({ meta: { status: 200, message: "ok" }, data: { _id: "u1", name: "Budi", email: "b@x", role: "technician", isActive: true } });
    await expect(getMe("tok")).resolves.toMatchObject({ role: "technician" });
    expect(new Headers((spy.mock.calls[0][1] as RequestInit).headers).get("Authorization")).toBe("Bearer tok");
  });
});
