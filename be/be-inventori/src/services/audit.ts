import type { Request } from "express";
import AuditLogModel from "../models/audit-log.model";
import UserModel from "../models/user.model";
import EquipmentModel from "../models/equipment.model";

export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.login_failed",
  "auth.login_inactive",
  "user.create",
  "user.update",
  "user.delete",
  "equipment.create",
  "equipment.update",
  "category.create",
  "category.update",
  "category.delete",
  "loan.borrow",
  "loan.return",
  "tracker.reset",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export const AUDIT_GROUPS = ["auth", "user", "equipment", "category", "loan", "tracker"] as const;

export type AuditEntry = {
  actor?: { id?: string; name?: string; role?: string } | null;
  action: AuditAction;
  target?: { type: string; id?: string; label?: string };
  detail?: string;
  ip?: string;
};

export type AuditWriter = (e: AuditEntry) => Promise<void>;

export const mongoAuditWriter: AuditWriter = async (e) => {
  await AuditLogModel.create({
    actor: e.actor?.id ?? null,
    actorName: e.actor?.name ?? "",
    actorRole: e.actor?.role ?? "",
    action: e.action,
    targetType: e.target?.type ?? "",
    targetId: e.target?.id ?? "",
    targetLabel: (e.target?.label ?? "").slice(0, 200),
    detail: (e.detail ?? "").slice(0, 1000),
    ip: (e.ip ?? "").slice(0, 64),
  });
};

/** Mencatat audit tanpa pernah menggagalkan aksi utamanya: kesalahan audit hanya dicatat ke log server. */
export async function writeAudit(e: AuditEntry, writer: AuditWriter = mongoAuditWriter): Promise<void> {
  try {
    await writer(e);
  } catch (err) {
    console.error("audit write failed", e.action, err);
  }
}

type ReqWithUser = Request & { user?: { id: string; role: string; name?: string } };

export const clientIp = (req: Request): string =>
  String(req.headers?.["x-forwarded-for"] ?? "").split(",")[0].trim() || req.ip || "";

/** Audit atas nama pengguna yang sedang login (dari middleware auth). */
export function audit(req: ReqWithUser, action: AuditAction, target?: AuditEntry["target"], detail?: string) {
  const u = req.user;
  return writeAudit({ actor: u ? { id: u.id, name: u.name, role: u.role } : null, action, target, detail, ip: clientIp(req) });
}

const CONDITION: Record<string, string> = { good: "Baik", broken: "Rusak", repair: "Perbaikan" };
export const conditionLabel = (c: unknown): string => CONDITION[String(c)] ?? "-";

export type FieldSpec = { key: string; label: string; format?: (v: any) => string };

/** Ringkasan perubahan yang terbaca manusia, mis. "peran: technician → admin; status: aktif → nonaktif". */
export function describeChanges(before: Record<string, any> | null | undefined, after: Record<string, any>, fields: FieldSpec[]): string {
  if (!before) return "";
  const parts: string[] = [];
  for (const f of fields) {
    if (!(f.key in after) || after[f.key] === undefined) continue;
    const fmt = f.format ?? ((v: any) => (v === undefined || v === null || v === "" ? "-" : String(v)));
    const a = fmt(before[f.key]);
    const b = fmt(after[f.key]);
    if (a !== b) parts.push(`${f.label}: ${a} → ${b}`);
  }
  return parts.join("; ");
}

export async function equipmentLabel(id: unknown): Promise<string> {
  try {
    const e: any = await EquipmentModel.findById(id).select("name serial").lean();
    return e ? `${e.name} (${e.serial})` : "";
  } catch {
    return "";
  }
}

export async function userLabel(id: unknown): Promise<string> {
  try {
    const u: any = await UserModel.findById(id).select("name email").lean();
    return u ? `${u.name} <${u.email}>` : "";
  } catch {
    return "";
  }
}
