import LoanModel from "../models/loan.model";
import EquipmentModel from "../models/equipment.model";
import LocationLogModel from "../models/location-log.model";
import { computeDashboard } from "./dashboard-service";
import { env } from "../utils/env";
import { mongoScanStore } from "./scan-store";
import { borrowedNow } from "./scan-service";
import { eventsFromLoans, formatLoanEvent, formatSummary, sendTelegram, type BotContext, type Summary } from "./telegram";

const populated = () => LoanModel.find().populate("technician", "name").populate({ path: "equipment", populate: { path: "category", select: "name" } });

/** Kabari grup Telegram setelah pinjam/kembali berhasil. Best effort: tidak pernah melempar galat. */
export async function notifyLoan(loanId: string, type: "borrow" | "return", via?: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  try {
    const l: any = await LoanModel.findById(loanId)
      .populate("technician", "name")
      .populate({ path: "equipment", populate: { path: "category", select: "name" } })
      .lean();
    if (!l?.equipment) return;
    const text = formatLoanEvent({
      type,
      equipment: l.equipment.name,
      serial: l.equipment.serial,
      category: l.equipment.category?.name,
      technician: l.technician?.name ?? "-",
      at: type === "return" && l.returnedAt ? new Date(l.returnedAt) : new Date(l.borrowedAt),
      condition: type === "return" ? l.returnCondition : undefined,
      via,
    });
    await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, text);
  } catch {
    /* pinjam/kembali sudah tersimpan; notifikasi boleh gagal */
  }
}

const CALIBRATION_DAYS = 30;

/** Angka ringkasan gudang, memakai hitungan yang sama dengan dashboard web. */
export async function warehouseSummary(now = new Date()): Promise<Summary> {
  const [equipment, openLoans] = await Promise.all([
    EquipmentModel.find().select("status condition nextCalibration").lean<any[]>(),
    LoanModel.find({ returnedAt: null }).select("borrowedAt").lean<any[]>(),
  ]);
  const d = computeDashboard({ equipment, openLoans }, now, { overdueDays: env.OVERDUE_DAYS, calibrationDays: CALIBRATION_DAYS });
  return {
    total: equipment.length,
    available: d.equipmentByStatus.available,
    borrowed: d.equipmentByStatus.borrowed,
    overdue: d.overdueLoans.length,
    overdueDays: env.OVERDUE_DAYS,
    broken: d.equipmentByCondition.broken,
    repair: d.equipmentByCondition.repair,
    calibrationDue: d.calibrationDue.length,
  };
}

/** Ringkasan pagi otomatis ke grup (dipanggil cron harian). */
export async function sendDailySummary(): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const now = new Date();
  return sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, formatSummary(await warehouseSummary(now), now));
}

export function botContext(): BotContext {
  const deps: any = { scan: mongoScanStore };
  return {
    chatId: env.TELEGRAM_CHAT_ID,
    overdueDays: env.OVERDUE_DAYS,
    summary: () => warehouseSummary(),
    async problems() {
      const rows: any[] = await EquipmentModel.find({ condition: { $in: ["broken", "repair"] } }).select("name serial condition location").sort({ name: 1 }).lean();
      return rows.map((e) => ({ name: e.name, serial: e.serial, condition: e.condition, location: e.location || undefined }));
    },
    async calibration() {
      const until = new Date(Date.now() + CALIBRATION_DAYS * 86_400_000);
      const rows: any[] = await EquipmentModel.find({ nextCalibration: { $ne: null, $lte: until } }).select("name serial nextCalibration").lean();
      return rows.map((e) => ({ name: e.name, serial: e.serial, nextCalibration: new Date(e.nextCalibration) }));
    },
    /** Privasi: hanya teknisi yang sedang memegang alat. */
    async positions() {
      const open = await LoanModel.aggregate<{ _id: unknown; n: number }>([
        { $match: { returnedAt: null } },
        { $group: { _id: "$technician", n: { $sum: 1 } } },
      ]);
      if (!open.length) return [];
      const last = await LocationLogModel.aggregate<any>([
        { $match: { technician: { $in: open.map((o) => o._id) } } },
        { $sort: { at: -1 } },
        { $group: { _id: "$technician", lat: { $first: "$lat" }, lng: { $first: "$lng" }, at: { $first: "$at" } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
      ]);
      const holding = new Map(open.map((o) => [String(o._id), o.n]));
      return last
        .map((p) => ({ technician: p.u?.[0]?.name ?? "-", holding: holding.get(String(p._id)) ?? 0, lat: p.lat, lng: p.lng, at: new Date(p.at) }))
        .sort((a, b) => b.at.getTime() - a.at.getTime());
    },
    borrowed: () => borrowedNow(deps, { id: "", role: "admin" }, new Date(), env.OVERDUE_DAYS),
    async history(limit) {
      const loans: any[] = await populated().sort({ updatedAt: -1 }).limit(limit).lean();
      return eventsFromLoans(loans, limit);
    },
    send: (chatId, text) => sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, text),
  };
}
