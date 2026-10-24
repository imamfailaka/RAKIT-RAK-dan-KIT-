import mongoose from "mongoose";
import { env } from "./utils/env";

/** Membungkus fungsi connect agar hanya dijalankan sekali (dipakai ulang antar request serverless). */
export function createDbConnector(connect: () => Promise<unknown>) {
  let pending: Promise<void> | null = null;
  return () => {
    if (!pending) {
      pending = connect().then(() => undefined);
      pending.catch(() => { pending = null; }); // gagal tidak boleh tersimpan
    }
    return pending;
  };
}

export const ensureDb = createDbConnector(() => {
  if (!env.SECRET) throw new Error("SECRET is required");
  return mongoose.connect(env.DATABASE_URL, { dbName: "db-inventori", serverSelectionTimeoutMS: 8000 });
});
