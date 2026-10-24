import LoginAttemptModel from "../models/login-attempt.model";
import type { AttemptStore } from "./login-guard";

const bump = (key: string) =>
  LoginAttemptModel.findOneAndUpdate({ key }, { $inc: { count: 1 }, $set: { updatedAt: new Date() } }, { upsert: true, new: true }).lean();

export const mongoAttemptStore: AttemptStore = {
  async get(key) {
    const r: any = await LoginAttemptModel.findOne({ key }).lean();
    return r ? { count: r.count, lockedUntil: r.lockedUntil ?? null } : null;
  },
  async increment(key) {
    try {
      return ((await bump(key)) as any).count;
    } catch (e) {
      if ((e as any)?.code !== 11000) throw e; // two first guesses raced to create the row: the row exists now
      return ((await bump(key)) as any).count;
    }
  },
  async lock(key, until) {
    await LoginAttemptModel.updateOne({ key }, { $set: { lockedUntil: until, updatedAt: new Date() } });
  },
  async reset(key) {
    await LoginAttemptModel.deleteOne({ key });
  },
};
