import { describe, it, expect, vi } from "vitest";
import { formatCalibration, formatOverdue, formatPositions, formatProblems, formatSummary, handleUpdate, parseCommand, HELP } from "../src/services/telegram";

const NOW = new Date("2026-11-14T01:00:00Z");
const day = 86_400_000;

describe("perintah Telegram untuk manager", () => {
  it("mengenali perintah baru", () => {
    for (const c of ["ringkasan", "terlambat", "rusak", "kalibrasi", "posisi"]) expect(parseCommand(`/${c}@RakitBot`)?.name).toBe(c);
    expect(HELP).toMatch(/\/ringkasan/);
  });
  it("ringkasan menandai hal yang perlu ditindaklanjuti", () => {
    const t = formatSummary({ total: 20, available: 15, borrowed: 5, overdue: 2, overdueDays: 7, broken: 1, repair: 0, calibrationDue: 3 }, NOW);
    expect(t).toMatch(/Alat: 20 unit · tersedia 15 · dipinjam 5/);
    expect(t).toMatch(/⚠️ Terlambat \(>7 hari\): 2/);
    expect(t).toMatch(/Detail: \/terlambat/);
    const ok = formatSummary({ total: 5, available: 5, borrowed: 0, overdue: 0, overdueDays: 7, broken: 0, repair: 0, calibrationDue: 0 }, NOW);
    expect(ok).toMatch(/Semua aman/);
  });
  it("terlambat hanya berisi pinjaman yang lewat batas, terlama dulu", () => {
    const b = (name: string, days: number, overdue: boolean) => ({ serial: name, name, borrower: "Budi", borrowedAt: new Date(NOW.getTime() - days * day), days, overdue, mine: false });
    const t = formatOverdue([b("A", 3, false), b("B", 9, true), b("C", 12, true)], 7);
    expect(t).toMatch(/2 unit/);
    expect(t.indexOf("C (C)")).toBeLessThan(t.indexOf("B (B)"));
    expect(t).not.toMatch(/A \(A\)/);
    expect(formatOverdue([], 7)).toMatch(/Tidak ada/);
  });
  it("rusak, kalibrasi, dan posisi", () => {
    expect(formatProblems([{ name: "OTDR", serial: "S1", condition: "broken", location: "Gudang" }])).toMatch(/OTDR \(S1\) · Rusak · Gudang/);
    const cal = formatCalibration([
      { name: "B", serial: "2", nextCalibration: new Date(NOW.getTime() + 10 * day) },
      { name: "A", serial: "1", nextCalibration: new Date(NOW.getTime() - 2 * day) },
    ], NOW);
    expect(cal).toMatch(/1\. A \(1\) · LEWAT 2 hari/);
    expect(cal).toMatch(/2\. B \(2\) · 10 hari lagi/);
    const pos = formatPositions([{ technician: "Sari", holding: 2, lat: -6.9, lng: 107.6, at: new Date(NOW.getTime() - 5 * 3_600_000) }], NOW);
    expect(pos).toMatch(/Sari · memegang 2 alat · update 5 jam lalu ⚠️/);
    expect(pos).toMatch(/maps\?q=-6.9,107.6/);
  });
  it("handleUpdate memanggil sumber data yang sesuai", async () => {
    const ctx = {
      chatId: "-100",
      overdueDays: 7,
      borrowed: vi.fn(async () => []),
      history: vi.fn(async () => []),
      summary: vi.fn(async () => ({ total: 1, available: 1, borrowed: 0, overdue: 0, overdueDays: 7, broken: 0, repair: 0, calibrationDue: 0 })),
      problems: vi.fn(async () => []),
      calibration: vi.fn(async () => []),
      positions: vi.fn(async () => []),
      send: vi.fn(async () => {}),
    };
    const upd = (text: string) => ({ message: { chat: { id: -100 }, text } });
    await handleUpdate(upd("/ringkasan"), ctx);
    await handleUpdate(upd("/rusak"), ctx);
    await handleUpdate(upd("/kalibrasi"), ctx);
    await handleUpdate(upd("/posisi"), ctx);
    await handleUpdate(upd("/terlambat"), ctx);
    expect(ctx.summary).toHaveBeenCalled();
    expect(ctx.problems).toHaveBeenCalled();
    expect(ctx.calibration).toHaveBeenCalled();
    expect(ctx.positions).toHaveBeenCalled();
    expect(ctx.borrowed).toHaveBeenCalled();
    expect(ctx.send).toHaveBeenCalledTimes(5);
  });
});

describe("ringkasan harian (cron)", () => {
  it("menolak pemanggil tanpa CRON_SECRET yang cocok", async () => {
    process.env.CRON_SECRET = "rahasia-cron";
    const { default: telegramController } = await import("../src/controllers/telegram.controller");
    const out: any = {};
    const res: any = { status: (c: number) => { out.status = c; return res; }, json: () => res };
    await telegramController.daily({ header: () => "Bearer salah" } as any, res);
    expect(out.status).toBe(403);
  });
});
