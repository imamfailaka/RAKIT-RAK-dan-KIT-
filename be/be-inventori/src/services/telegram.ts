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

const COMMANDS = ["dipinjam", "riwayat", "ringkasan", "terlambat", "rusak", "kalibrasi", "posisi"] as const;
export type CommandName = (typeof COMMANDS)[number] | "bantuan";

export function parseCommand(text: string): { name: CommandName; arg: string } | null {
  const m = /^\/([a-z]+)(?:@\w+)?(?:\s+(.*))?$/i.exec(text.trim());
  if (!m) return null;
  const word = m[1].toLowerCase();
  const arg = (m[2] ?? "").trim();
  if ((COMMANDS as readonly string[]).includes(word)) return { name: word as CommandName, arg };
  if (word === "start" || word === "bantuan" || word === "help") return { name: "bantuan", arg: "" };
  return null;
}

export const HELP = [
  "Bot Rakit",
  "/ringkasan - ringkasan gudang hari ini (untuk manager)",
  "/dipinjam - siapa memegang alat apa saat ini",
  "/terlambat - pinjaman yang lewat batas hari",
  "/rusak - alat rusak / dalam perbaikan",
  "/kalibrasi - alat yang kalibrasinya jatuh tempo (30 hari)",
  "/posisi - posisi terakhir teknisi yang sedang memegang alat",
  "/riwayat [jumlah] - riwayat pinjam dan kembali (bawaan 10, maksimal 30)",
].join("\n");

export type Summary = {
  total: number;
  available: number;
  borrowed: number;
  overdue: number;
  overdueDays: number;
  broken: number;
  repair: number;
  calibrationDue: number;
};
export type ProblemItem = { name: string; serial: string; condition: "broken" | "repair"; location?: string };
export type CalibrationItem = { name: string; serial: string; nextCalibration: Date };
export type PositionItem = { technician: string; holding: number; lat: number; lng: number; at: Date };

export function formatSummary(s: Summary, now: Date): string {
  const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now);
  const attention = s.overdue + s.broken + s.repair + s.calibrationDue;
  return [
    `📊 RINGKASAN RAKIT · ${date}`,
    `Alat: ${s.total} unit · tersedia ${s.available} · dipinjam ${s.borrowed}`,
    `${s.overdue ? "⚠️" : "✅"} Terlambat (>${s.overdueDays} hari): ${s.overdue}`,
    `${s.broken + s.repair ? "🔧" : "✅"} Rusak: ${s.broken} · Perbaikan: ${s.repair}`,
    `${s.calibrationDue ? "📅" : "✅"} Kalibrasi jatuh tempo ≤30 hari: ${s.calibrationDue}`,
    attention ? "Detail: /terlambat /rusak /kalibrasi /posisi" : "Semua aman, tidak ada yang perlu ditindaklanjuti.",
  ].join("\n");
}

export function formatOverdue(items: BorrowedItem[], overdueDays: number): string {
  const late = items.filter((b) => b.overdue).sort((a, b) => b.days - a.days);
  if (!late.length) return `✅ Tidak ada pinjaman yang lewat ${overdueDays} hari.`;
  return [
    `⚠️ Terlambat (>${overdueDays} hari): ${late.length} unit`,
    ...late.map((b, i) => `${i + 1}. ${b.name} (${b.serial})\n   ${b.borrower ?? "-"} · ${b.days} hari sejak ${when(b.borrowedAt)}`),
  ].join("\n");
}

export function formatProblems(items: ProblemItem[]): string {
  if (!items.length) return "✅ Tidak ada alat rusak atau dalam perbaikan.";
  return [
    `🔧 Alat bermasalah: ${items.length} unit`,
    ...items.map((e, i) => `${i + 1}. ${e.name} (${e.serial}) · ${CONDITION[e.condition]}${e.location ? ` · ${e.location}` : ""}`),
  ].join("\n");
}

export function formatCalibration(items: CalibrationItem[], now: Date): string {
  if (!items.length) return "✅ Tidak ada kalibrasi yang jatuh tempo dalam 30 hari.";
  const day = 86_400_000;
  const rows = [...items]
    .sort((a, b) => new Date(a.nextCalibration).getTime() - new Date(b.nextCalibration).getTime())
    .map((e, i) => {
      const d = Math.ceil((new Date(e.nextCalibration).getTime() - now.getTime()) / day);
      const tag = d < 0 ? `LEWAT ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`;
      return `${i + 1}. ${e.name} (${e.serial}) · ${tag}`;
    });
  return [`📅 Kalibrasi jatuh tempo: ${items.length} unit`, ...rows].join("\n");
}

export function formatPositions(items: PositionItem[], now: Date): string {
  if (!items.length) return "Belum ada posisi teknisi yang sedang memegang alat.";
  const rows = items.map((p, i) => {
    const mins = Math.max(0, Math.round((now.getTime() - new Date(p.at).getTime()) / 60_000));
    const ago = mins < 60 ? `${mins} menit lalu` : `${Math.round(mins / 60)} jam lalu`;
    return `${i + 1}. ${p.technician} · memegang ${p.holding} alat · update ${ago}${mins > 240 ? " ⚠️" : ""}\n   https://www.google.com/maps?q=${p.lat},${p.lng}`;
  });
  return ["📍 Posisi teknisi (hanya yang memegang alat)", ...rows].join("\n");
}

export type BotContext = {
  chatId: string;
  overdueDays?: number;
  borrowed(): Promise<BorrowedItem[]>;
  history(limit: number): Promise<HistoryEntry[]>;
  summary?(): Promise<Summary>;
  problems?(): Promise<ProblemItem[]>;
  calibration?(): Promise<CalibrationItem[]>;
  positions?(): Promise<PositionItem[]>;
  send(chatId: string, text: string): Promise<unknown>;
};

/** Hanya grup yang diizinkan yang dilayani; chat lain diabaikan tanpa balasan. */
export async function handleUpdate(update: any, ctx: BotContext): Promise<void> {
  const msg = update?.message;
  const text = typeof msg?.text === "string" ? msg.text : "";
  if (!msg || String(msg.chat?.id) !== ctx.chatId || !text) return;
  const cmd = parseCommand(text);
  if (!cmd) return;
  const now = new Date();
  const reply = (text: string) => ctx.send(ctx.chatId, text);
  switch (cmd.name) {
    case "bantuan":
      return void (await reply(HELP));
    case "dipinjam":
      return void (await reply(formatBorrowedList(await ctx.borrowed())));
    case "terlambat":
      return void (await reply(formatOverdue(await ctx.borrowed(), ctx.overdueDays ?? 7)));
    case "ringkasan":
      if (ctx.summary) await reply(formatSummary(await ctx.summary(), now));
      return;
    case "rusak":
      if (ctx.problems) await reply(formatProblems(await ctx.problems()));
      return;
    case "kalibrasi":
      if (ctx.calibration) await reply(formatCalibration(await ctx.calibration(), now));
      return;
    case "posisi":
      if (ctx.positions) await reply(formatPositions(await ctx.positions(), now));
      return;
    case "riwayat": {
      const n = Number.parseInt(cmd.arg, 10);
      const limit = Number.isFinite(n) ? Math.min(30, Math.max(1, n)) : 10;
      await reply(formatHistory(await ctx.history(limit)));
    }
  }
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
    const base = { equipment: l.equipment.name, serial: l.equipment.serial, category: l.equipment.category?.name, technician: l.technician?.name ?? "(akun dihapus)" };
    out.push({ ...base, type: "borrow", at: new Date(l.borrowedAt) });
    if (l.returnedAt) out.push({ ...base, type: "return", at: new Date(l.returnedAt), condition: l.returnCondition });
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
