import { Response } from "express";
import { IReqUser } from "../middlewares/auth";
import { borrowedNow, scanCategory, scanBorrow, scanInfo, scanReturn, type ScanDeps } from "../services/scan-service";
import { mongoEquipmentStore, mongoTechnicianLookup } from "../services/equipment-store";
import { mongoLoanStore } from "../services/loan-store";
import { mongoScanStore } from "../services/scan-store";
import response from "../utils/response";
import { env } from "../utils/env";

const deps: ScanDeps = {
  equipment: mongoEquipmentStore,
  loans: mongoLoanStore,
  technicians: mongoTechnicianLookup,
  scan: mongoScanStore,
};
const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : undefined);
const caller = (req: IReqUser) => ({ id: req.user!.id, role: req.user!.role as "admin" | "technician" });

function fail(res: Response, r: { code: 400 | 403 | 404 | 409; message: string }) {
  if (r.code === 404) return response.notFound(res, r.message);
  // HTTP 403 means "session invalid" to the web app, so someone else's loan is reported as a conflict.
  if (r.code === 403 || r.code === 409) return response.conflict(res, r.message);
  return response.badRequest(res, r.message, { returnCondition: "Kondisi tidak valid" });
}

export default {
  async borrowed(req: IReqUser, res: Response) {
    try {
      response.success(res, await borrowedNow(deps, caller(req), new Date(), env.OVERDUE_DAYS), "success list borrowed");
    } catch (error) {
      response.error(res, error, "failed to list borrowed");
    }
  },
  async category(req: IReqUser, res: Response) {
    try {
      const r = await scanCategory(deps, req.params.id, caller(req));
      if (!r.ok) return fail(res, r);
      response.success(res, r, "success scan category");
    } catch (error) {
      response.error(res, error, "failed to scan category");
    }
  },
  // Read-only: never changes data, so prefetchers and crawlers are harmless.
  async info(req: IReqUser, res: Response) {
    try {
      const r = await scanInfo(deps, req.params.serial, caller(req));
      if (!r.ok) return fail(res, r);
      response.success(res, r, "success scan");
    } catch (error) {
      response.error(res, error, "failed to scan");
    }
  },
  async borrow(req: IReqUser, res: Response) {
    try {
      const r = await scanBorrow(deps, req.params.serial, caller(req));
      if (!r.ok) return fail(res, r);
      response.created(res, r.loan, "success borrow by scan");
    } catch (error) {
      response.error(res, error, "failed to borrow by scan");
    }
  },
  async return(req: IReqUser, res: Response) {
    try {
      const r = await scanReturn(deps, req.params.serial, caller(req), req.body?.returnCondition, text(req.body?.note));
      if (!r.ok) return fail(res, r);
      response.success(res, r.loan, "success return by scan");
    } catch (error) {
      response.error(res, error, "failed to return by scan");
    }
  },
};
