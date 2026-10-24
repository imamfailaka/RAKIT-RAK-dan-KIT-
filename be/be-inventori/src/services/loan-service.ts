export type Condition = "good" | "broken" | "repair";

export type LoanRecord = {
  id: string;
  equipment: string;
  technician: string;
  recordedBy: string;
  borrowedAt: Date;
  returnedAt?: Date | null;
  returnCondition?: Condition;
  note?: string;
};

export interface EquipmentStore {
  find(id: string): Promise<{ id: string; status: "available" | "borrowed"; condition: Condition } | null>;
  /** Atomic: only flips available+good -> borrowed; false when it lost the race or the unit is unfit. */
  markBorrowedIfAvailable(id: string): Promise<boolean>;
  markReturned(id: string, condition: Condition): Promise<void>;
  revertToAvailable(id: string): Promise<void>;
}

export interface LoanStore {
  create(l: { equipment: string; technician: string; recordedBy: string; note?: string }): Promise<LoanRecord>;
  find(id: string): Promise<LoanRecord | null>;
  /** Atomic: closes the loan only if it is still open; null when already closed. */
  closeIfOpen(id: string, returnCondition: Condition, note?: string): Promise<LoanRecord | null>;
}

export interface TechnicianLookup {
  exists(id: string): Promise<boolean>;
}

export type LoanDeps = { equipment: EquipmentStore; loans: LoanStore; technicians: TechnicianLookup };
export type LoanResult = { ok: true; loan: LoanRecord } | { ok: false; code: 400 | 404 | 409; message: string };

const CONDITIONS: Condition[] = ["good", "broken", "repair"];

export async function borrow(
  deps: LoanDeps,
  input: { equipmentId: string; technicianId: string; recordedBy: string; note?: string },
): Promise<LoanResult> {
  const eq = await deps.equipment.find(input.equipmentId);
  if (!eq) return { ok: false, code: 404, message: "equipment not found" };
  if (!(await deps.technicians.exists(input.technicianId))) {
    return { ok: false, code: 404, message: "technician not found or not active" };
  }
  if (!(await deps.equipment.markBorrowedIfAvailable(input.equipmentId))) {
    const why = eq.condition !== "good" ? "equipment is not in good condition" : "equipment is already borrowed";
    return { ok: false, code: 409, message: why };
  }
  try {
    const loan = await deps.loans.create({
      equipment: input.equipmentId,
      technician: input.technicianId,
      recordedBy: input.recordedBy,
      note: input.note,
    });
    return { ok: true, loan };
  } catch (e) {
    await deps.equipment.revertToAvailable(input.equipmentId);
    throw e;
  }
}

export async function returnLoan(
  deps: LoanDeps,
  loanId: string,
  returnCondition: Condition,
  note?: string,
): Promise<LoanResult> {
  if (!CONDITIONS.includes(returnCondition)) return { ok: false, code: 400, message: "invalid return condition" };
  const existing = await deps.loans.find(loanId);
  if (!existing) return { ok: false, code: 404, message: "loan not found" };
  const closed = await deps.loans.closeIfOpen(loanId, returnCondition, note);
  if (!closed) return { ok: false, code: 409, message: "this loan has already been returned" };
  await deps.equipment.markReturned(closed.equipment, returnCondition);
  return { ok: true, loan: closed };
}
