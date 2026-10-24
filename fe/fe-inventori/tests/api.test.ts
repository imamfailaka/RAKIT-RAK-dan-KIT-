import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/errors";

const ok = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_API_URL = "http://api.test/api";
});

describe("apiFetch", () => {
  it("sends the Bearer header when a token is given", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      ok({ meta: { status: 200, message: "ok" }, data: [] }),
    );
    await apiFetch("/events", { token: "abc" });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc");
  });

  it("drops undefined query values", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      ok({ meta: { status: 200, message: "ok" }, data: [] }),
    );
    await apiFetch("/events", { query: { page: 1, category: undefined } });
    expect(spy.mock.calls[0][0]).toBe("http://api.test/api/events?page=1");
  });

  it("throws ApiError with the envelope status on 403", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      ok({ meta: { status: 403, message: "forbidden" }, data: null }, 403),
    );
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      constructor: ApiError,
      status: 403,
    });
  });
});
