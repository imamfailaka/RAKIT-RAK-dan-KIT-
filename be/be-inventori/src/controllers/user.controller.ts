import { Response } from "express";
import UserModel, { userCreateDTO, userUpdateDTO } from "../models/user.model";
import { IReqUser } from "../middlewares/auth";
import { buildUserPayload } from "../services/payloads";
import { hashPassword } from "../utils/password";
import response from "../utils/response";

const isDuplicate = (e: any) => e?.code === 11000;

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      const { limit = 10, page = 1, search, role } = req.query as any;
      const q: any = {};
      if (role === "admin" || role === "technician") q.role = role;
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
      if (valid.password) valid.password = hashPassword(valid.password);
      const user = await UserModel.findByIdAndUpdate(id, valid, { new: true });
      if (!user) return response.notFound(res, "user not found");
      response.success(res, user, "success update user");
    } catch (error) {
      if (isDuplicate(error)) return response.conflict(res, "email already used", { email: "Email sudah dipakai" });
      if ((error as any)?.name === "CastError") return response.notFound(res, "user not found");
      response.error(res, error, "failed to update user");
    }
  },
};
