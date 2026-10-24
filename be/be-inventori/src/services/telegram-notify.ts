import LoanModel from "../models/loan.model";
import { env } from "../utils/env";
import { mongoScanStore } from "./scan-store";
import { borrowedNow } from "./scan-service";
import { eventsFromLoans, formatLoanEvent, sendTelegram, type BotContext } from "./telegram";

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

export function botContext(): BotContext {
  const deps: any = { scan: mongoScanStore };
  return {
    chatId: env.TELEGRAM_CHAT_ID,
    borrowed: () => borrowedNow(deps, { id: "", role: "admin" }, new Date(), env.OVERDUE_DAYS),
    async history(limit) {
      const loans: any[] = await populated().sort({ updatedAt: -1 }).limit(limit).lean();
      return eventsFromLoans(loans, limit);
    },
    send: (chatId, text) => sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, text),
  };
}
