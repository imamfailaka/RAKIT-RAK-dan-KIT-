import { describe, it, expect, vi } from "vitest";
import { reportError } from "@/lib/handle-error";
import { ApiError } from "@/lib/errors";
import { setToken, getToken } from "@/lib/auth";

describe("reportError", () => {
  it("clears the token and calls onSession for a 403", () => {
    setToken("abc");
    const onSession = vi.fn();
    const notify = vi.fn();
    reportError(new ApiError(403, null), { notify, onSession });
    expect(getToken()).toBeUndefined();
    expect(onSession).toHaveBeenCalledOnce();
  });
  it("notifies and returns field errors for a 400", () => {
    const notify = vi.fn();
    const err = reportError(new ApiError(400, { email: "bad" }), { notify, onSession: vi.fn() });
    expect(err.fields).toEqual({ email: "bad" });
  });
  it("notifies for a network failure", () => {
    const notify = vi.fn();
    reportError(new TypeError("fetch failed"), { notify, onSession: vi.fn() });
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/terhubung/i), "error");
  });
});
