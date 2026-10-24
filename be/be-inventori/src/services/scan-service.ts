import { borrow, returnLoan, type Condition, type LoanDeps, type LoanRecord } from "./loan-service";

export type ScanEquipment = {
  id: string;
  serial: string;
  name: string;
  status: "available" | "borrowed";
  condition: Condition;
  category?: string;
};
export type OpenLoan = { id: string; technicianId: string; technicianName?: string; borrowedAt: Date };

export interface ScanStore {
  findBySerial(serial: string): Promise<ScanEquipment | null>;
  findOpenLoan(equipmentId: string): Promise<OpenLoan | null>;
  findCategory(id: string): Promise<{ id: string; name: string } | null>;
  /** All units in a category with their open loan (if any), ordered by name then serial. */
  listByCategory(categoryId: string): Promise<{ equipment: ScanEquipment; loan: OpenLoan | null }[]>;
}

export type ScanDeps = LoanDeps & { scan: ScanStore };
export type Caller = { id: string; role: "admin" | "technician" };

export type ScanInfo =
  | {
      ok: true;
      equipment: ScanEquipment;
      loan: { id: string; borrower?: string; borrowedAt: Date; mine: boolean } | null;
      action: "borrow" | "return" | "blocked" | "view";
      reason?: "not_good" | "borrowed_by_other";
      borrower?: string;
    }
  | { ok: false; code: 404; message: string };

export type ScanResult = { ok: true; loan: LoanRecord } | { ok: false; code: 400 | 403 | 404 | 409; message: string };

const NOT_FOUND = { ok: false, code: 404, message: "equipment not found" } as const;

/** Read-only: what would a scan do for this caller. Never changes data. */
export async function scanInfo(deps: ScanDeps, serial: string, caller: Caller): Promise<ScanInfo> {
  const equipment = await deps.scan.findBySerial(serial);
  if (!equipment) return NOT_FOUND;
  const open = equipment.status === "borrowed" ? await deps.scan.findOpenLoan(equipment.id) : null;
  const loan = open
    ? { id: open.id, borrower: open.technicianName, borrowedAt: open.borrowedAt, mine: open.technicianId === caller.id }
    : null;
  if (caller.role !== "technician") return { ok: true, equipment, loan, action: "view" };
  if (equipment.status === "borrowed") {
    if (loan?.mine) return { ok: true, equipment, loan, action: "return" };
    return { ok: true, equipment, loan, action: "blocked", reason: "borrowed_by_other", borrower: loan?.borrower };
  }
  if (equipment.condition !== "good") return { ok: true, equipment, loan, action: "blocked", reason: "not_good" };
  return { ok: true, equipment, loan, action: "borrow" };
}

/** The technician borrows for themself; the atomic rules of `borrow` still decide. */
export async function scanBorrow(deps: ScanDeps, serial: string, caller: Caller): Promise<ScanResult> {
  const equipment = await deps.scan.findBySerial(serial);
  if (!equipment) return NOT_FOUND;
  return borrow(deps, { equipmentId: equipment.id, technicianId: caller.id, recordedBy: caller.id, note: "Scan QR" });
}

/** Only the borrower can return a scanned unit. */
export async function scanReturn(deps: ScanDeps, serial: string, caller: Caller, returnCondition: Condition, note?: string): Promise<ScanResult> {
  const equipment = await deps.scan.findBySerial(serial);
  if (!equipment) return NOT_FOUND;
  const open = await deps.scan.findOpenLoan(equipment.id);
  if (!open) return { ok: false, code: 409, message: "there is no active loan for this equipment" };
  if (open.technicianId !== caller.id) return { ok: false, code: 403, message: "this loan belongs to another technician" };
  return returnLoan(deps, open.id, returnCondition, note);
}

export type CategoryScanItem = {
  id: string;
  serial: string;
  name: string;
  status: "available" | "borrowed";
  condition: Condition;
  borrower?: string;
  borrowedAt?: Date;
  mine: boolean;
  /** What this caller may do with the unit right now. Borrowed units are locked for everyone but the borrower. */
  action: "borrow" | "return" | "locked" | "view";
};
export type CategoryScan =
  | { ok: true; category: { id: string; name: string }; items: CategoryScanItem[] }
  | { ok: false; code: 404; message: string };

/** Read-only list behind the category QR: who holds what, and which button each caller gets. */
export async function scanCategory(deps: ScanDeps, categoryId: string, caller: Caller): Promise<CategoryScan> {
  const category = await deps.scan.findCategory(categoryId);
  if (!category) return { ok: false, code: 404, message: "category not found" };
  const rows = await deps.scan.listByCategory(categoryId);
  const items = rows.map(({ equipment: e, loan }): CategoryScanItem => {
    const mine = !!loan && loan.technicianId === caller.id;
    let action: CategoryScanItem["action"] = "locked";
    if (caller.role !== "technician") action = "view";
    else if (e.status === "borrowed") action = mine ? "return" : "locked";
    else if (e.condition === "good") action = "borrow";
    return { id: e.id, serial: e.serial, name: e.name, status: e.status, condition: e.condition, borrower: loan?.technicianName, borrowedAt: loan?.borrowedAt, mine, action };
  });
  return { ok: true, category, items };
}
