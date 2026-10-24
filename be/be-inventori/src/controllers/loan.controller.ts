import { Response } from "express";
import mongoose from "mongoose";
import LoanModel from "../models/loan.model";
import { IReqUser } from "../middlewares/auth";
import { borrow, returnLoan } from "../services/loan-service";
import { mongoEquipmentStore, mongoTechnicianLookup } from "../services/equipment-store";
import { mongoLoanStore } from "../services/loan-store";
import { notifyLoan } from "../services/telegram-notify";
import { pageParams } from "../utils/paginate";
import response from "../utils/response";

const deps = { equipment: mongoEquipmentStore, loans: mongoLoanStore, technicians: mongoTechnicianLookup };
const isId = (v: unknown): v is string => typeof v === "string" && mongoose.isValidObjectId(v);
const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : undefined);

async function list(req: IReqUser, res: Response, forceOwn: boolean) {
  try {
    const { limit, page, skip } = pageParams(req);
    const q: any = {};
    // Technicians only ever see their own loans; the filter comes from the token, never the query.
    if (forceOwn || req.user?.role === "technician") q.technician = req.user!.id;
    else if (isId(req.query.technician)) q.technician = req.query.technician;
    if (req.query.open === "true") q.returnedAt = null;
    const [data, total] = await Promise.all([
      LoanModel.find(q)
        .populate("equipment", "name serial")
        .populate("technician", "name")
        .sort({ borrowedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoanModel.countDocuments(q),
    ]);
    response.pagination(res, data, { total, current: page, totalPages: Math.ceil(total / limit) }, "success find loans");
  } catch (error) {
    response.error(res, error, "failed to find loans");
  }
}

export default {
  findAll: (req: IReqUser, res: Response) => list(req, res, false),
  mine: (req: IReqUser, res: Response) => list(req, res, true),
  async create(req: IReqUser, res: Response) {
    try {
      const { equipment, technician, note } = req.body ?? {};
      const errors: Record<string, string> = {};
      if (!isId(equipment)) errors.equipment = "Alat wajib dipilih";
      if (!isId(technician)) errors.technician = "Teknisi wajib dipilih";
      if (Object.keys(errors).length) return response.badRequest(res, "failed to create loan", errors);
      const r = await borrow(deps, { equipmentId: equipment, technicianId: technician, recordedBy: req.user!.id, note: text(note) });
      if (!r.ok) return respond(res, r);
      await notifyLoan(r.loan.id, "borrow", "dicatat admin");
      response.created(res, r.loan, "success create loan");
    } catch (error) {
      response.error(res, error, "failed to create loan");
    }
  },
  async return(req: IReqUser, res: Response) {
    try {
      if (!isId(req.params.id)) return response.notFound(res, "loan not found");
      const r = await returnLoan(deps, req.params.id, req.body?.returnCondition, text(req.body?.note));
      if (!r.ok) return respond(res, r);
      await notifyLoan(r.loan.id, "return", "dicatat admin");
      response.success(res, r.loan, "success return loan");
    } catch (error) {
      response.error(res, error, "failed to return loan");
    }
  },
};

function respond(res: Response, r: { code: 400 | 404 | 409; message: string }) {
  if (r.code === 404) return response.notFound(res, r.message);
  if (r.code === 409) return response.conflict(res, r.message);
  return response.badRequest(res, r.message, { returnCondition: "Kondisi tidak valid" });
}
