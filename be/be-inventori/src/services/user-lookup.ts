import UserModel from "../models/user.model";
import type { UserLookup } from "../middlewares/auth";

export const mongoUserLookup: UserLookup = async (id) => {
  const u: any = await UserModel.findById(id).select("role isActive").lean();
  return u ? { role: u.role, isActive: u.isActive } : null;
};
