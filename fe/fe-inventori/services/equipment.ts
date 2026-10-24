import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { makeCrud } from "@/lib/crud";

export type Condition = "good" | "broken" | "repair";
export type Equipment = {
  _id: string;
  serial: string;
  name: string;
  category: string | { _id: string; name: string } | null;
  location?: string;
  condition: Condition;
  status: "available" | "borrowed";
  lastCalibration?: string | null;
  nextCalibration?: string | null;
};
export type EquipmentInput = {
  serial: string;
  name: string;
  category: string;
  location: string;
  condition: Condition;
  lastCalibration?: string;
  nextCalibration?: string;
};
export const equipmentAdmin = makeCrud<Equipment, EquipmentInput>("/equipment");

/** Units that can be lent right now (for the loan form). */
export async function listAvailableEquipment(): Promise<Equipment[]> {
  const res = await apiFetch<Equipment[]>("/equipment", { token: getToken(), query: { status: "available", condition: "good", limit: 100 } });
  return res.data;
}
