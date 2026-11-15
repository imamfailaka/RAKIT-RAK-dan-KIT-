import { Response } from "express";
import UserModel, { userCreateDTO, userUpdateDTO } from "../models/user.model";
import { IReqUser } from "../middlewares/auth";
import { buildUserPayload } from "../services/payloads";
import { hashPassword } from "../utils/password";
import { deleteUser, mongoUserDeleteStore } from "../services/user-delete";
import { audit, describeChanges, userLabel } from "../services/audit";

const ROLE_ID: Record<string, string> = { admin: "Admin", manager: "Manager", technician: "Teknisi" };
const USER_FIELDS = [
  { key: "name", label: "nama" },
  { key: "email", label: "email" },
  { key: "role", label: "peran", format: (v: any) => ROLE_ID[v] ?? String(v ?? "-") },
  { key: "isActive", label: "status", format: (v: any) => (v === false ? "nonaktif" : "aktif") },
];
import response from "../utils/response";

const isDuplicate = (e: any) => e?.code === 11000;

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      const { limit = 10, page = 1, search, role } = req.query as any;
      const q: any = {};
      if (role === "admin" || role === "manager" || role === "technician") q.role = role;
      if (search) q.$or = [{ name: new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { email: new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }];
      const lim = Math.min(Math.max(+limit || 10, 1), 100);
      const pg = Math.max(+page || 1, 1);
      const [data, total] = await Promise.all([
        UserModel.find(q).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim).lean(),
        UserModel.countDocuments(q),
      ]);
      response.pagination(res, data, { total, current: pg, totalPages: Math.ceil(total / lim) }, "success find users");
    } catch (error) {
      response.error(res, error, "failed to find users");
    }
  },
  async create(req: IReqUser, res: Response) {
    try {
      const valid = await userCreateDTO.validate(buildUserPayload(req.body), { abortEarly: false });
      const user = await UserModel.create({ ...valid, password: hashPassword(valid.password) });
      await audit(req, "user.create", { type: "user", id: String(user._id), label: `${user.name} <${user.email}>` }, `peran: ${ROLE_ID[valid.role] ?? valid.role}`);
      response.created(res, { ...user.toObject(), password: undefined }, "success create user");
    } catch (error) {
      if (isDuplicate(error)) return response.conflict(res, "email already used", { email: "Email sudah dipakai" });
      response.error(res, error, "failed to create user");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const valid: any = await userUpdateDTO.validate(buildUserPayload(req.body), { abortEarly: false });
      if (id === req.user?.id && (valid.role === "technician" || valid.isActive === false)) {
        return response.conflict(res, "you cannot demote or deactivate yourself");
      }
      const before: any = await UserModel.findById(id).lean();
      if (!before) return response.notFound(res, "user not found");
      const changes = describeChanges(before, valid, USER_FIELDS);
      const passwordChanged = Boolean(valid.password);
      if (valid.password) valid.password = hashPassword(valid.password);
      const user = await UserModel.findByIdAndUpdate(id, valid, { new: true });
      if (!user) return response.notFound(res, "user not found");
      const detail = [changes, passwordChanged ? "password diganti" : ""].filter(Boolean).join("; ") || "tanpa perubahan";
      await audit(req, "user.update", { type: "user", id: String(user._id), label: `${user.name} <${user.email}>` }, detail);
      response.success(res, user, "success update user");
    } catch (error) {
      if (isDuplicate(error)) return response.conflict(res, "email already used", { email: "Email sudah dipakai" });
      if ((error as any)?.name === "CastError") return response.notFound(res, "user not found");
      response.error(res, error, "failed to update user");
    }
  },  async remove(req: IReqUser, res: Response) {
    try {
      const label = await userLabel(req.params.id);
      const result = await deleteUser(mongoUserDeleteStore, req.user?.id, String(req.params.id));
      if (result === "self") return response.conflict(res, "you cannot delete yourself");
      if (result === "not_found") return response.notFound(res, "user not found");
      if (result === "has_active_loan") return response.conflict(res, "user still has borrowed equipment");
      await audit(req, "user.delete", { type: "user", id: String(req.params.id), label }, "akun dihapus permanen");
      response.success(res, { _id: req.params.id }, "success delete user");
    } catch (error) {
      if ((error as any)?.name === "CastError") return response.notFound(res, "user not found");
      response.error(res, error, "failed to delete user");
    }
  },
};
