import LoanModel from "../models/loan.model";
import type { LoanRecord, LoanStore } from "./loan-service";

const toRecord = (l: any): LoanRecord => ({
  id: String(l._id),
  equipment: String(l.equipment),
  technician: String(l.technician),
  recordedBy: String(l.recordedBy),
  borrowedAt: l.borrowedAt,
  returnedAt: l.returnedAt ?? null,
  returnCondition: l.returnCondition,
  note: l.note,
});

export const mongoLoanStore: LoanStore = {
  async create(l) {
    return toRecord(await LoanModel.create(l));
  },
  async find(id) {
    const l = await LoanModel.findById(id).lean();
    return l ? toRecord(l) : null;
  },
  async closeIfOpen(id, returnCondition, note) {
    const l = await LoanModel.findOneAndUpdate(
      { _id: id, returnedAt: null },
      { returnedAt: new Date(), returnCondition, ...(note ? { note } : {}) },
      { new: true }
    ).lean();
    return l ? toRecord(l) : null;
  },
};
