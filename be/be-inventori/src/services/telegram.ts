import type { BorrowedItem } from "./scan-service";

export type LoanEvent = {
  type: "borrow" | "return";
  equipment: string;
  serial: string;
  category?: string;
  technician: string;
  at: Date;
  condition?: string;
  via?: string;
};
export type HistoryEntry = LoanEvent;

const CONDITION: Record<string, string> = { good: "Baik", broken: "Rusak", repair: "Perbaikan" };
const WIB = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const when = (d: Date) => `${WIB.format(new Date(d))} WIB`;

export function formatLoanEvent(e: LoanEvent): string {
  const head = e.type === "borrow" ? "📤 DIPINJAM" : "📥 DIKEMBALIKAN";
  const lines = [head, `${e.equipment} (${e.serial})`];
  if (e.category) lines.push(`Kategori: ${e.category}`);
  lines.push(`Teknisi: ${e.technician}`);
  if (e.type === "return" && e.condition) lines.push(`Kondisi: ${CONDITION[e.condition] ?? e.condition}`);
  lines.push(`Waktu: ${when(e.at)}${e.via ? ` · ${e.via}` : ""}`);
  return lines.join("\n");
}

export function formatBorrowedList(items: BorrowedItem[]): string {
  if (!items.length) return "Tidak ada alat yang sedang dipinjam.";
  const rows = items.map((b, i) => `${i + 1}. ${b.name} (${b.serial})\n   ${b.borrower ?? "-"}${b.email ? ` · ${b.email}` : ""}\n   sejak ${when(b.borrowedAt)} · ${b.days} hari${b.overdue ? " · TERLAMBAT" : ""}`);
  return [`Sedang dipinjam: ${items.length} unit`, ...rows].join("\n");
}

export function formatHistory(list: HistoryEntry[]): string {
  if (!list.length) return "Belum ada riwayat peminjaman.";
  return ["Riwayat terbaru", ...list.map((e) => `${e.type === "borrow" ? "📤" : "📥"} ${when(e.at)}\n   ${e.technician} ${e.type === "borrow" ? "meminjam" : "mengembalikan"} ${e.equipment} (${e.serial})${e.type === "return" && e.condition ? ` · ${CONDITION[e.condition] ?? e.condition}` : ""}`)].join("\n");
}

export function parseCommand(text: string): { name: "dipinjam" | "riwayat" | "bantuan"; arg: string } | null {
  const m = /^\/([a-z]+)(?:@\w+)?(?:\s+(.*))?$/i.exec(text.trim());
  if (!m) return null;
  const word = m[1].toLowerCase();
  const arg = (m[2] ?? "").trim();
  if (word === "dipinjam" || word === "riwayat") return { name: word, arg };
  if (word === "start" || word === "bantuan" || word === "help") return { name: "bantuan", arg: "" };
  return null;
}

export const HELP = "Bot Rakit\n/dipinjam - siapa memegang alat apa saat ini\n/riwayat [jumlah] - riwayat pinjam dan kembali (bawaan 10, maksimal 30)";

export type BotContext = {
  chatId: string;
  borrowed(): Promise<BorrowedItem[]>;
  history(limit: number): Promise<HistoryEntry[]>;
  send(chatId: string, text: string): Promise<unknown>;
};

/** Hanya grup yang diizinkan yang dilayani; chat lain diabaikan tanpa balasan. */
export async function handleUpdate(update: any, ctx: BotContext): Promise<void> {
  const msg = update?.message;
  const text = typeof msg?.text === "string" ? msg.text : "";
  if (!msg || String(msg.chat?.id) !== ctx.chatId || !text) return;
  const cmd = parseCommand(text);
  if (!cmd) return;
  if (cmd.name === "bantuan") return void (await ctx.send(ctx.chatId, HELP));
  if (cmd.name === "dipinjam") return void (await ctx.send(ctx.chatId, formatBorrowedList(await ctx.borrowed())));
  const n = Number.parseInt(cmd.arg, 10);
  const limit = Number.isFinite(n) ? Math.min(30, Math.max(1, n)) : 10;
  await ctx.send(ctx.chatId, formatHistory(await ctx.history(limit)));
}

/** Kirim pesan; tidak pernah melempar galat supaya transaksi pinjam/kembali tidak ikut gagal. */
export async function sendTelegram(token: string, chatId: string, text: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  if (!token || !chatId) return false;
  try {
    const r = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Ubah daftar pinjaman (sudah di-populate) menjadi kejadian pinjam/kembali, terbaru dulu. */
export function eventsFromLoans(loans: any[], limit: number): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const l of loans) {
    if (!l.equipment) continue;
    const base = { equipment: l.equipment.name, serial: l.equipment.serial, category: l.equipment.category?.name, technician: l.technician?.name ?? "-" };
    out.push({ ...base, type: "borrow", at: new Date(l.borrowedAt) });
    if (l.returnedAt) out.push({ ...base, type: "return", at: new Date(l.returnedAt), condition: l.returnCondition });
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
