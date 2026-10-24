import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { listPage, type Page } from "@/lib/crud";
import type { Condition } from "@/services/equipment";

export type Loan = {
  _id: string;
  equipment: { _id?: string; name?: string; serial?: string } | null;
  technician: { _id?: string; name?: string } | null;
  borrowedAt: string;
  returnedAt?: string | null;
  returnCondition?: Condition;
  note?: string;
};

export const listLoans = (page: number, open?: boolean): Promise<Page<Loan>> =>
  listPage<Loan>("/loans", { page, limit: 10, open: open ? true : undefined });

export const listMyLoans = (page: number): Promise<Page<Loan>> => listPage<Loan>("/loans/mine", { page, limit: 10 });

export async function borrowEquipment(input: { equipment: string; technician: string; note?: string }): Promise<Loan> {
  const res = await apiFetch<Loan>("/loans", { method: "POST", token: getToken(), body: JSON.stringify(input) });
  return res.data;
}

export async function returnLoan(id: string, input: { returnCondition: Condition; note?: string }): Promise<Loan> {
  const res = await apiFetch<Loan>(`/loans/${encodeURIComponent(id)}/return`, {
    method: "POST",
    token: getToken(),
    body: JSON.stringify(input),
  });
  return res.data;
}
