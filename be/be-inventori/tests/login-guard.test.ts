import { describe, it, expect, beforeEach } from "vitest";
import { checkLock, loginKey, recordFailure, recordSuccess, MAX_FAILED, LOCK_MINUTES, type AttemptStore } from "../src/services/login-guard";

class FakeAttempts implements AttemptStore {
  rows = new Map<string, { count: number; lockedUntil: Date | null }>();
  async get(key: string) { return this.rows.get(key) ?? null; }
  async increment(key: string) {
    const r = this.rows.get(key) ?? { count: 0, lockedUntil: null };
    r.count += 1;
    this.rows.set(key, r);
    return r.count;
  }
  async lock(key: string, until: Date) { const r = this.rows.get(key)!; r.lockedUntil = until; }
  async reset(key: string) { this.rows.delete(key); }
}

let store: FakeAttempts;
const t0 = new Date("2026-10-24T10:00:00Z");
const minutes = (m: number) => new Date(t0.getTime() + m * 60_000);

beforeEach(() => { store = new FakeAttempts(); });

describe("loginKey", () => {
  it("ignores letter case and surrounding spaces", () => {
    expect(loginKey("  Admin@Inventori.Local ")).toBe("admin@inventori.local");
  });
});

describe("login guard", () => {
  it("allows four failures and locks on the fifth", async () => {
    for (let i = 1; i < MAX_FAILED; i++) expect((await recordFailure(store, "a@x", t0)).locked).toBe(false);
    const fifth = await recordFailure(store, "a@x", t0);
    expect(fifth).toEqual({ locked: true, minutesLeft: LOCK_MINUTES });
    expect(await checkLock(store, "a@x", t0)).toEqual({ locked: true, minutesLeft: LOCK_MINUTES });
  });
  it("reports the time left, rounded up, while locked", async () => {
    for (let i = 0; i < MAX_FAILED; i++) await recordFailure(store, "a@x", t0);
    expect(await checkLock(store, "a@x", minutes(10))).toEqual({ locked: true, minutesLeft: 5 });
    expect(await checkLock(store, "a@x", new Date(minutes(14).getTime() + 30_000))).toEqual({ locked: true, minutesLeft: 1 });
  });
  it("unlocks after the lock period and starts counting from zero again", async () => {
    for (let i = 0; i < MAX_FAILED; i++) await recordFailure(store, "a@x", t0);
    expect(await checkLock(store, "a@x", minutes(LOCK_MINUTES))).toEqual({ locked: false });
    for (let i = 1; i < MAX_FAILED; i++) expect((await recordFailure(store, "a@x", minutes(LOCK_MINUTES))).locked).toBe(false);
  });
  it("a successful login clears earlier failures", async () => {
    for (let i = 1; i < MAX_FAILED; i++) await recordFailure(store, "a@x", t0);
    await recordSuccess(store, "a@x");
    for (let i = 1; i < MAX_FAILED; i++) expect((await recordFailure(store, "a@x", t0)).locked).toBe(false);
  });
  it("counts each email separately", async () => {
    for (let i = 0; i < MAX_FAILED; i++) await recordFailure(store, "a@x", t0);
    expect(await checkLock(store, "b@x", t0)).toEqual({ locked: false });
  });
  it("is not locked when nothing was recorded", async () => {
    expect(await checkLock(store, "new@x", t0)).toEqual({ locked: false });
  });
});
