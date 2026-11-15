import UserModel from "../models/user.model";
import LoanModel from "../models/loan.model";
import LocationLogModel from "../models/location-log.model";

export interface UserDeleteStore {
  exists(id: string): Promise<boolean>;
  /** true bila pengguna masih memegang alat (pinjaman belum dikembalikan). */
  hasActiveLoan(id: string): Promise<boolean>;
  /** Hapus permanen akun beserta jejak lokasinya. Riwayat pinjaman tetap disimpan untuk audit. */
  remove(id: string): Promise<void>;
}

export type DeleteResult = "deleted" | "self" | "not_found" | "has_active_loan";

/**
 * Hapus akun permanen (bukan sekadar nonaktif). Token lama otomatis tidak berlaku
 * karena middleware auth mencari pengguna di database pada setiap permintaan.
 */
export async function deleteUser(store: UserDeleteStore, actorId: string | undefined, targetId: string): Promise<DeleteResult> {
  if (actorId && actorId === targetId) return "self";
  if (!(await store.exists(targetId))) return "not_found";
  if (await store.hasActiveLoan(targetId)) return "has_active_loan";
  await store.remove(targetId);
  return "deleted";
}

export const mongoUserDeleteStore: UserDeleteStore = {
  async exists(id) {
    return Boolean(await UserModel.exists({ _id: id }));
  },
  async hasActiveLoan(id) {
    return Boolean(await LoanModel.exists({ technician: id, returnedAt: null }));
  },
  async remove(id) {
    await LocationLogModel.deleteMany({ technician: id });
    await UserModel.deleteOne({ _id: id });
  },
};
