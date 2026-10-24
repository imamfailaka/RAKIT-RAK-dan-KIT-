import { describe, it, expect, vi } from "vitest";
import { formatLoanEvent, formatBorrowedList, formatHistory, eventsFromLoans, parseCommand, handleUpdate, sendTelegram, type HistoryEntry } from "../src/services/telegram";

const at = new Date("2026-10-24T08:30:00Z");

describe("format pesan", () => {
  it("pinjam menyebut teknisi, unit, dan waktu", () => {
    const t = formatLoanEvent({ type: "borrow", equipment: "OTDR DEVISER AE2300", serial: "DEVISER-AE2300-01", category: "OTDR", technician: "Budi", at, via: "Scan QR" });
    expect(t).toContain("DIPINJAM");
    expect(t).toContain("Budi");
    expect(t).toContain("DEVISER-AE2300-01");
    expect(t).toContain("OTDR");
  });
  it("kembali menyebut kondisi", () => {
    const t = formatLoanEvent({ type: "return", equipment: "Splicer", serial: "W33", technician: "Rina", at, condition: "broken" });
    expect(t).toContain("DIKEMBALIKAN");
    expect(t).toContain("Rusak");
  });
  it("daftar dipinjam: kosong, terlambat, dan urutan", () => {
    expect(formatBorrowedList([])).toMatch(/tidak ada/i);
    const t = formatBorrowedList([{ serial: "A", name: "OTDR", category: "OTDR", borrower: "Budi", email: "b@x.id", borrowedAt: at, days: 9, overdue: true, mine: false }]);
    expect(t).toContain("Budi");
    expect(t).toContain("9 hari");
    expect(t).toContain("TERLAMBAT");
  });
  it("riwayat", () => {
    const e: HistoryEntry = { type: "return", equipment: "OFI", serial: "OFI-01", technician: "Rina", at, condition: "good" };
    expect(formatHistory([e])).toContain("OFI-01");
    expect(formatHistory([])).toMatch(/belum ada/i);
  });
});

describe("perintah", () => {
  it("mengenali perintah, termasuk @namabot dan argumen", () => {
    expect(parseCommand("/dipinjam")).toEqual({ name: "dipinjam", arg: "" });
    expect(parseCommand("/riwayat@RakitBot 5")).toEqual({ name: "riwayat", arg: "5" });
    expect(parseCommand("/start")).toEqual({ name: "bantuan", arg: "" });
    expect(parseCommand("halo")).toBeNull();
    expect(parseCommand("/lain")).toBeNull();
  });
});

describe("handleUpdate", () => {
  const ctx = () => ({
    chatId: "-100",
    borrowed: vi.fn(async () => []),
    history: vi.fn(async () => []),
    send: vi.fn(async () => {}),
  });
  const upd = (chat: number, text: string) => ({ message: { chat: { id: chat }, text } });
  it("hanya melayani grup yang diizinkan", async () => {
    const c = ctx();
    await handleUpdate(upd(999, "/dipinjam"), c);
    expect(c.send).not.toHaveBeenCalled();
    expect(c.borrowed).not.toHaveBeenCalled();
  });
  it("/dipinjam membalas daftar ke grup yang sama", async () => {
    const c = ctx();
    await handleUpdate(upd(-100, "/dipinjam"), c);
    expect(c.borrowed).toHaveBeenCalled();
    expect(c.send).toHaveBeenCalledWith("-100", expect.stringMatching(/tidak ada/i));
  });
  it("/riwayat membatasi jumlah antara 1 dan 30", async () => {
    const c = ctx();
    await handleUpdate(upd(-100, "/riwayat 500"), c);
    expect(c.history).toHaveBeenCalledWith(30);
    await handleUpdate(upd(-100, "/riwayat"), c);
    expect(c.history).toHaveBeenLastCalledWith(10);
  });
  it("mengabaikan pesan tanpa teks atau perintah tak dikenal", async () => {
    const c = ctx();
    await handleUpdate({ message: { chat: { id: -100 } } }, c);
    await handleUpdate(upd(-100, "ngobrol"), c);
    expect(c.send).not.toHaveBeenCalled();
  });
});

describe("sendTelegram", () => {
  it("memanggil API Telegram dengan token dan chat id", async () => {
    const f = vi.fn(async (_u: string, _i: RequestInit) => new Response("{}", { status: 200 }));
    await sendTelegram("TOKEN", "-100", "halo", f as unknown as typeof fetch);
    expect(String(f.mock.calls[0][0])).toBe("https://api.telegram.org/botTOKEN/sendMessage");
    expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ chat_id: "-100", text: "halo" });
  });
  it("tidak pernah melempar galat, agar pinjam/kembali tidak ikut gagal", async () => {
    const f = vi.fn(async () => { throw new Error("jaringan"); });
    await expect(sendTelegram("T", "1", "x", f as unknown as typeof fetch)).resolves.toBe(false);
  });
  it("tanpa token atau chat id tidak mengirim apa pun", async () => {
    const f = vi.fn();
    expect(await sendTelegram("", "1", "x", f as unknown as typeof fetch)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("eventsFromLoans", () => {
  const base = { equipment: { name: "OTDR", serial: "A-1", category: { name: "OTDR" } }, technician: { name: "Budi" } };
  it("satu pinjaman selesai menjadi dua kejadian, terbaru lebih dulu, dibatasi jumlahnya", () => {
    const loans = [
      { ...base, borrowedAt: new Date("2026-10-20T01:00:00Z"), returnedAt: new Date("2026-10-21T01:00:00Z"), returnCondition: "good" },
      { ...base, equipment: { name: "OFI", serial: "OFI-01" }, borrowedAt: new Date("2026-10-22T01:00:00Z"), returnedAt: null },
    ];
    const e = eventsFromLoans(loans, 10);
    expect(e.map((x) => `${x.type}:${x.serial}`)).toEqual(["borrow:OFI-01", "return:A-1", "borrow:A-1"]);
    expect(eventsFromLoans(loans, 2)).toHaveLength(2);
  });
  it("melewati pinjaman yang alatnya sudah terhapus", () => {
    expect(eventsFromLoans([{ equipment: null, technician: { name: "x" }, borrowedAt: new Date() }], 5)).toEqual([]);
  });
});
