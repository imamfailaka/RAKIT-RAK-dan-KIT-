import { Response } from "express";
import AuditLogModel from "../models/audit-log.model";
import { IReqUser } from "../middlewares/auth";
import { AUDIT_GROUPS } from "../services/audit";
import { escapeRegex, pageParams } from "../utils/paginate";
import response from "../utils/response";

export function auditQuery(query: Record<string, unknown>): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  const group = String(query.group ?? "");
  if ((AUDIT_GROUPS as readonly string[]).includes(group)) q.action = new RegExp(`^${group}\\.`);
  const search = String(query.search ?? "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    q.$or = [{ actorName: rx }, { targetLabel: rx }, { detail: rx }];
  }
  return q;
}

export default {
  /** Admin dan manager: daftar catatan audit, terbaru dulu. */
  async list(req: IReqUser, res: Response) {
    try {
      const { limit, page, skip } = pageParams(req);
      const q = auditQuery(req.query as any);
      const [data, total] = await Promise.all([
        AuditLogModel.find(q).sort({ at: -1 }).skip(skip).limit(limit).lean(),
        AuditLogModel.countDocuments(q),
      ]);
      response.pagination(res, data, { total, current: page, totalPages: Math.ceil(total / limit) }, "success find audit logs");
    } catch (error) {
      response.error(res, error, "failed to find audit logs");
    }
  },
};
