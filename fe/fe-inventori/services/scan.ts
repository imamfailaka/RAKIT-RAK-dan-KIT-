import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Condition } from "@/services/equipment";
import type { Loan } from "@/services/loans";

export type CategoryScanItem = {
  id: string;
  serial: string;
  name: string;
  status: "available" | "borrowed";
  condition: Condition;
  borrower?: string;
  borrowedAt?: string;
  mine: boolean;
  /** borrow/return = tombol aktif; locked = tidak bisa diklik; view = admin hanya melihat. */
  action: "borrow" | "return" | "locked" | "view";
};
export type CategoryScan = { category: { id: string; name: string }; items: CategoryScanItem[] };

const unit = (serial: string) => `/scan/${encodeURIComponent(serial)}`;

export async function getCategoryScan(categoryId: string): Promise<CategoryScan> {
  return (await apiFetch<CategoryScan>(`/scan/category/${encodeURIComponent(categoryId)}`, { token: getToken() })).data;
}
export async function scanBorrow(serial: string): Promise<Loan> {
  return (await apiFetch<Loan>(`${unit(serial)}/borrow`, { method: "POST", token: getToken(), body: "{}" })).data;
}
export async function scanReturn(serial: string, input: { returnCondition: Condition; note?: string }): Promise<Loan> {
  return (await apiFetch<Loan>(`${unit(serial)}/return`, { method: "POST", token: getToken(), body: JSON.stringify(input) })).data;
}

export type BorrowedItem = {
  serial: string;
  name: string;
  category?: string;
  borrower?: string;
  email?: string;
  borrowedAt: string;
  days: number;
  overdue: boolean;
  mine: boolean;
};
/** Semua unit yang sedang dipinjam beserta peminjamnya, agar teknisi bisa saling menghubungi. */
export async function listBorrowed(): Promise<BorrowedItem[]> {
  return (await apiFetch<BorrowedItem[]>("/scan/borrowed", { token: getToken() })).data;
}
