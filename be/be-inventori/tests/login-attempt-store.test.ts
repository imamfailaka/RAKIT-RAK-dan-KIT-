import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginAttemptModel from "../src/models/login-attempt.model";
import { mongoAttemptStore } from "../src/services/login-attempt-store";

beforeEach(() => vi.restoreAllMocks());

describe("mongoAttemptStore", () => {
  it("counts a failure with ONE atomic upsert-increment (safe for parallel guesses)", async () => {
    const spy = vi.spyOn(LoginAttemptModel, "findOneAndUpdate").mockReturnValue({ lean: async () => ({ count: 3 }) } as never);
    expect(await mongoAttemptStore.increment("a@x")).toBe(3);
    const [filter, update, options] = spy.mock.calls[0] as any[];
    expect(filter).toEqual({ key: "a@x" });
    expect(update.$inc).toEqual({ count: 1 });
    expect(options).toMatchObject({ upsert: true, new: true });
  });
  it("expires old rows by itself (TTL index on updatedAt)", () => {
    const ttl = (LoginAttemptModel as any).schema.indexes().find(([, o]: any[]) => o?.expireAfterSeconds);
    expect(ttl).toBeDefined();
    expect(ttl[0]).toEqual({ updatedAt: 1 });
  });
});
