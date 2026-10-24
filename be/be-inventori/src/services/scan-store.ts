import mongoose from "mongoose";
import CategoryModel from "../models/category.model";
import EquipmentModel from "../models/equipment.model";
import LoanModel from "../models/loan.model";
import type { OpenLoan, ScanEquipment, ScanStore } from "./scan-service";

const toScan = (e: any): ScanEquipment => ({
  id: String(e._id),
  serial: e.serial,
  name: e.name,
  status: e.status,
  condition: e.condition,
  category: e.category?.name,
});

export const mongoScanStore: ScanStore = {
  async findCategory(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const c: any = await CategoryModel.findById(id).lean();
    return c ? { id: String(c._id), name: c.name } : null;
  },
  async listByCategory(categoryId) {
    const eq: any[] = await EquipmentModel.find({ category: categoryId }).populate("category", "name").sort({ name: 1, serial: 1 }).lean();
    const loans: any[] = await LoanModel.find({ equipment: { $in: eq.map((e) => e._id) }, returnedAt: null }).populate("technician", "name").lean();
    const byEq = new Map(loans.map((l) => [String(l.equipment), l]));
    return eq.map((e) => {
      const l = byEq.get(String(e._id));
      const t = l?.technician;
      return {
        equipment: toScan(e),
        loan: l ? { id: String(l._id), technicianId: String(t?._id ?? l.technician), technicianName: t?.name, borrowedAt: l.borrowedAt } : null,
      };
    });
  },
  async findBySerial(serial): Promise<ScanEquipment | null> {
    const e: any = await EquipmentModel.findOne({ serial: String(serial).trim() })
      .populate("category", "name")
      .lean();
    if (!e) return null;
    return {
      id: String(e._id),
      serial: e.serial,
      name: e.name,
      status: e.status,
      condition: e.condition,
      category: e.category?.name,
    };
  },
  async findOpenLoan(equipmentId): Promise<OpenLoan | null> {
    const l: any = await LoanModel.findOne({ equipment: equipmentId, returnedAt: null })
      .populate("technician", "name")
      .lean();
    if (!l) return null;
    const t = l.technician;
    return {
      id: String(l._id),
      technicianId: String(t?._id ?? l.technician),
      technicianName: t?.name,
      borrowedAt: l.borrowedAt,
    };
  },
};
