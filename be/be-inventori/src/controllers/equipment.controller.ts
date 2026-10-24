import { Response } from "express";
import EquipmentModel, { equipmentDTO, equipmentUpdateDTO } from "../models/equipment.model";
import { IReqUser } from "../middlewares/auth";
import { buildEquipmentPayload } from "../services/payloads";
import { escapeRegex, pageParams } from "../utils/paginate";
import response from "../utils/response";

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      const { limit, page, skip } = pageParams(req);
      const { status, condition, search, category } = req.query as any;
      const q: any = {};
      if (status === "available" || status === "borrowed") q.status = status;
      if (["good", "broken", "repair"].includes(condition)) q.condition = condition;
      if (category && /^[a-f\d]{24}$/i.test(category)) q.category = category;
      if (search) {
        const rx = new RegExp(escapeRegex(String(search)), "i");
        q.$or = [{ name: rx }, { serial: rx }];
      }
      const [data, total] = await Promise.all([
        EquipmentModel.find(q).populate("category", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        EquipmentModel.countDocuments(q),
      ]);
      response.pagination(res, data, { total, current: page, totalPages: Math.ceil(total / limit) }, "success find equipment");
    } catch (error) {
      response.error(res, error, "failed to find equipment");
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const item = await EquipmentModel.findById(req.params.id).populate("category", "name").lean();
      if (!item) return response.notFound(res, "equipment not found");
      response.success(res, item, "success find equipment");
    } catch (error) {
      if ((error as any)?.name === "CastError") return response.notFound(res, "equipment not found");
      response.error(res, error, "failed to find equipment");
    }
  },
  async create(req: IReqUser, res: Response) {
    try {
      const valid = await equipmentDTO.validate(buildEquipmentPayload(req.body), { abortEarly: false });
      response.created(res, await EquipmentModel.create(valid), "success create equipment");
    } catch (error) {
      if ((error as any)?.code === 11000) return response.conflict(res, "serial exists", { serial: "Serial sudah terdaftar" });
      response.error(res, error, "failed to create equipment");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const valid = await equipmentUpdateDTO.validate(buildEquipmentPayload(req.body), { abortEarly: false });
      const result = await EquipmentModel.findByIdAndUpdate(req.params.id, valid, { new: true });
      if (!result) return response.notFound(res, "equipment not found");
      response.success(res, result, "success update equipment");
    } catch (error) {
      if ((error as any)?.code === 11000) return response.conflict(res, "serial exists", { serial: "Serial sudah terdaftar" });
      if ((error as any)?.name === "CastError") return response.notFound(res, "equipment not found");
      response.error(res, error, "failed to update equipment");
    }
  },
};
