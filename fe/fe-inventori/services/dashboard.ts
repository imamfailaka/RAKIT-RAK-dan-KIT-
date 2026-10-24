import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Equipment } from "@/services/equipment";
import type { Loan } from "@/services/loans";

export type AdminDashboard = {
  equipmentByStatus: { available: number; borrowed: number };
  equipmentByCondition: { good: number; broken: number; repair: number };
  activeLoans: number;
  overdueLoansCount: number;
  overdueLoans: Pick<Loan, "_id" | "borrowedAt" | "equipment" | "technician">[];
  calibrationDueCount: number;
  calibrationDue: Pick<Equipment, "_id" | "name" | "serial" | "nextCalibration">[];
  equipmentByCategory: { name: string; count: number }[];
  overdueDays: number;
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const res = await apiFetch<AdminDashboard>("/dashboard", { token: getToken() });
  return res.data;
}
