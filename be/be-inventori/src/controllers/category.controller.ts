import { Response } from "express";
import CategoryModel, { categoryDTO } from "../models/category.model";
import EquipmentModel from "../models/equipment.model";
import { IReqUser } from "../middlewares/auth";
import { buildCategoryPayload } from "../services/payloads";
import { sameNameFilter } from "../services/same-name";
import response from "../utils/response";

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      // Kategori lama berjenis "stock" (fitur stok sudah dihapus) disembunyikan, bukan dihapus.
      const q = { kind: { $ne: "stock" } };
      response.success(res, await CategoryModel.find(q).sort({ name: 1 }).lean(), "success find categories");
    } catch (error) {
      response.error(res, error, "failed to find categories");
    }
  },
  async create(req: IReqUser, res: Response) {
    try {
      const valid = await categoryDTO.validate(buildCategoryPayload(req.body), { abortEarly: false });
      if (await CategoryModel.exists(sameNameFilter(valid.name))) return response.conflict(res, "category exists", { name: "Nama kategori sudah ada" });
      response.created(res, await CategoryModel.create(valid), "success create category");
    } catch (error) {
      if ((error as any)?.code === 11000) return response.conflict(res, "category exists", { name: "Nama kategori sudah ada" });
      response.error(res, error, "failed to create category");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const valid = await categoryDTO.partial().validate(buildCategoryPayload(req.body), { abortEarly: false });
      if (valid.name && (await CategoryModel.exists(sameNameFilter(valid.name, String(req.params.id))))) {
        return response.conflict(res, "category exists", { name: "Nama kategori sudah ada" });
      }
      const result = await CategoryModel.findByIdAndUpdate(req.params.id, valid, { new: true });
      if (!result) return response.notFound(res, "category not found");
      response.success(res, result, "success update category");
    } catch (error) {
      if ((error as any)?.code === 11000) return response.conflict(res, "category exists", { name: "Nama kategori sudah ada" });
      if ((error as any)?.name === "CastError") return response.notFound(res, "category not found");
      response.error(res, error, "failed to update category");
    }
  },
  async remove(req: IReqUser, res: Response) {
    try {
      const id = req.params.id;
      if (await EquipmentModel.exists({ category: id })) return response.conflict(res, "category is still used by equipment");
      const result = await CategoryModel.findByIdAndDelete(id);
      if (!result) return response.notFound(res, "category not found");
      response.success(res, result, "success remove category");
    } catch (error) {
      if ((error as any)?.name === "CastError") return response.notFound(res, "category not found");
      response.error(res, error, "failed to remove category");
    }
  },
};
