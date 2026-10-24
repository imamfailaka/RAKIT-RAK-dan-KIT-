import EquipmentModel from "../models/equipment.model";
import UserModel from "../models/user.model";
import type { EquipmentStore, TechnicianLookup } from "./loan-service";

export const mongoEquipmentStore: EquipmentStore = {
  async find(id) {
    const e: any = await EquipmentModel.findById(id).lean();
    return e ? { id: String(e._id), status: e.status, condition: e.condition } : null;
  },
  async markBorrowedIfAvailable(id) {
    const e = await EquipmentModel.findOneAndUpdate(
      { _id: id, status: "available", condition: "good" },
      { status: "borrowed" }
    );
    return !!e;
  },
  async markReturned(id, condition) {
    await EquipmentModel.updateOne({ _id: id }, { status: "available", condition });
  },
  async revertToAvailable(id) {
    await EquipmentModel.updateOne({ _id: id }, { status: "available" });
  },
};

export const mongoTechnicianLookup: TechnicianLookup = {
  async exists(id) {
    return !!(await UserModel.exists({ _id: id, role: "technician", isActive: true }));
  },
};
