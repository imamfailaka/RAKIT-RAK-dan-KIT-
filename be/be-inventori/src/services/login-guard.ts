export const MAX_FAILED = 5;
export const LOCK_MINUTES = 15;

export interface AttemptStore {
  get(key: string): Promise<{ count: number; lockedUntil: Date | null } | null>;
  /** Atomic: adds one failure and returns the new total. */
  increment(key: string): Promise<number>;
  lock(key: string, until: Date): Promise<void>;
  reset(key: string): Promise<void>;
}

export type LockState = { locked: false } | { locked: true; minutesLeft: number };

/** Counts per submitted email (existing or not), so the answer never reveals which accounts exist. */
export const loginKey = (email: string): string => email.trim().toLowerCase();

const minutesUntil = (until: Date, now: Date) => Math.ceil((until.getTime() - now.getTime()) / 60_000);

export async function checkLock(store: AttemptStore, key: string, now: Date): Promise<LockState> {
  const row = await store.get(key);
  if (!row?.lockedUntil) return { locked: false };
  if (row.lockedUntil.getTime() <= now.getTime()) {
    await store.reset(key); // lock served: start counting from zero
    return { locked: false };
  }
  return { locked: true, minutesLeft: minutesUntil(row.lockedUntil, now) };
}

export async function recordFailure(store: AttemptStore, key: string, now: Date): Promise<LockState> {
  const count = await store.increment(key);
  if (count < MAX_FAILED) return { locked: false };
  await store.lock(key, new Date(now.getTime() + LOCK_MINUTES * 60_000));
  return { locked: true, minutesLeft: LOCK_MINUTES };
}

export async function recordSuccess(store: AttemptStore, key: string): Promise<void> {
  await store.reset(key);
}
