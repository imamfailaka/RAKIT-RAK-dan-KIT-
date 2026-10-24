import { describe, it, expect, beforeEach } from "vitest";
import { borrowedNow, scanCategory, scanInfo, scanBorrow, scanReturn, type ScanStore, type ScanEquipment, type OpenLoan } from "../src/services/scan-service";
import type { EquipmentStore, LoanStore, LoanRecord, Condition } from "../src/services/loan-service";

class Store implements ScanStore {
  eq = new Map<string, ScanEquipment & { loan?: OpenLoan }>();
  async findBySerial(serial: string) { return this.eq.get(serial) ?? null; }
  async findCategory(id: string) { return id === "C1" ? { id: "C1", name: "OTDR" } : null; }
  async listByCategory(categoryId: string) {
    return [...this.eq.values()].filter((e) => e.category === categoryId || categoryId === "C1").map((e) => ({ equipment: e, loan: e.loan ?? null }));
  }
  async listOpenLoans() {
    return [...this.eq.values()].filter((e) => e.loan).map((e) => ({ equipment: e, loan: e.loan! }));
  }
  async findOpenLoan(equipmentId: string) {
    for (const e of this.eq.values()) if (e.id === equipmentId) return e.loan ?? null;
    return null;
  }
}
class Equip implements EquipmentStore {
  constructor(private s: Store) {}
  private byId(id: string) { for (const e of this.s.eq.values()) if (e.id === id) return e; return undefined; }
  async find(id: string) { const e = this.byId(id); return e ? { id: e.id, status: e.status, condition: e.condition } : null; }
  async markBorrowedIfAvailable(id: string) { const e = this.byId(id)!; if (e.status !== "available" || e.condition !== "good") return false; e.status = "borrowed"; return true; }
  async markReturned(id: string, c: Condition) { const e = this.byId(id)!; e.status = "available"; e.condition = c; e.loan = undefined; }
  async revertToAvailable(id: string) { this.byId(id)!.status = "available"; }
}
class Loans implements LoanStore {
  constructor(private s: Store) {}
  n = 0;
  async create(l: { equipment: string; technician: string; recordedBy: string; note?: string }) {
    const rec: LoanRecord = { id: `L${++this.n}`, ...l, borrowedAt: new Date(), returnedAt: null };
    for (const e of this.s.eq.values()) if (e.id === l.equipment) e.loan = { id: rec.id, technicianId: l.technician, technicianName: "Budi", borrowedAt: rec.borrowedAt };
    return rec;
  }
  async find(id: string) {
    for (const e of this.s.eq.values()) if (e.loan?.id === id) return { id, equipment: e.id, technician: e.loan.technicianId, recordedBy: e.loan.technicianId, borrowedAt: e.loan.borrowedAt, returnedAt: null } as LoanRecord;
    return null;
  }
  async closeIfOpen(id: string, c: Condition) {
    const rec = await this.find(id);
    return rec ? ({ ...rec, returnedAt: new Date(), returnCondition: c } as LoanRecord) : null;
  }
}

let store: Store;
const deps = () => ({ equipment: new Equip(store), loans: new Loans(store), technicians: { exists: async (id: string) => id.startsWith("T") }, scan: store });
const tech = { id: "T1", role: "technician" as const };
const other = { id: "T2", role: "technician" as const };
const admin = { id: "A1", role: "admin" as const };

beforeEach(() => {
  store = new Store();
  store.eq.set("OTDR-1", { id: "E1", serial: "OTDR-1", name: "OTDR", status: "available", condition: "good", category: "Alat ukur" });
  store.eq.set("BRK-1", { id: "E2", serial: "BRK-1", name: "Cleaver", status: "available", condition: "broken", category: "Alat sambung" });
});

describe("scanInfo", () => {
  it("404 for an unknown serial", async () => {
    expect(await scanInfo(deps(), "NOPE", tech)).toMatchObject({ ok: false, code: 404 });
  });
  it("offers borrow for an available, good unit", async () => {
    expect(await scanInfo(deps(), "OTDR-1", tech)).toMatchObject({ ok: true, action: "borrow" });
  });
  it("blocks a broken unit with a reason", async () => {
    expect(await scanInfo(deps(), "BRK-1", tech)).toMatchObject({ ok: true, action: "blocked", reason: "not_good" });
  });
  it("offers return to the borrower, blocks others and names the borrower", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    expect(await scanInfo(deps(), "OTDR-1", tech)).toMatchObject({ action: "return" });
    expect(await scanInfo(deps(), "OTDR-1", other)).toMatchObject({ action: "blocked", reason: "borrowed_by_other", borrower: "Budi" });
  });
  it("is read-only for an admin", async () => {
    expect(await scanInfo(deps(), "OTDR-1", admin)).toMatchObject({ ok: true, action: "view" });
    expect(store.eq.get("OTDR-1")!.status).toBe("available");
  });
});

describe("scanBorrow", () => {
  it("borrows for the caller, recorded by the caller", async () => {
    const r = await scanBorrow(deps(), "OTDR-1", tech);
    expect(r).toMatchObject({ ok: true });
    expect(r.ok && r.loan).toMatchObject({ technician: "T1", recordedBy: "T1" });
    expect(store.eq.get("OTDR-1")!.status).toBe("borrowed");
  });
  it("409 when already borrowed or not good", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    expect(await scanBorrow(deps(), "OTDR-1", other)).toMatchObject({ ok: false, code: 409 });
    expect(await scanBorrow(deps(), "BRK-1", tech)).toMatchObject({ ok: false, code: 409 });
  });
  it("404 for an unknown serial", async () => {
    expect(await scanBorrow(deps(), "NOPE", tech)).toMatchObject({ ok: false, code: 404 });
  });
});

describe("scanReturn", () => {
  it("returns the caller's own loan with a condition", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    const r = await scanReturn(deps(), "OTDR-1", tech, "repair");
    expect(r).toMatchObject({ ok: true });
    expect(store.eq.get("OTDR-1")).toMatchObject({ status: "available", condition: "repair" });
  });
  it("403 when the loan belongs to another technician", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    expect(await scanReturn(deps(), "OTDR-1", other, "good")).toMatchObject({ ok: false, code: 403 });
    expect(store.eq.get("OTDR-1")!.status).toBe("borrowed");
  });
  it("409 when there is no open loan", async () => {
    expect(await scanReturn(deps(), "OTDR-1", tech, "good")).toMatchObject({ ok: false, code: 409 });
  });
  it("400 for an invalid condition", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    expect(await scanReturn(deps(), "OTDR-1", tech, "bogus" as never)).toMatchObject({ ok: false, code: 400 });
  });
});

describe("scanCategory", () => {
  const find = (r: any, serial: string) => r.items.find((i: any) => i.serial === serial);
  it("404 for an unknown category", async () => {
    expect(await scanCategory(deps(), "NOPE", tech)).toMatchObject({ ok: false, code: 404 });
  });
  it("offers borrow on free good units, nothing on broken ones", async () => {
    const r: any = await scanCategory(deps(), "C1", tech);
    expect(r.category).toEqual({ id: "C1", name: "OTDR" });
    expect(find(r, "OTDR-1").action).toBe("borrow");
    expect(find(r, "BRK-1").action).toBe("locked");
  });
  it("locks a borrowed unit for other technicians and offers return only to the borrower", async () => {
    await scanBorrow(deps(), "OTDR-1", tech);
    const mine: any = await scanCategory(deps(), "C1", tech);
    const theirs: any = await scanCategory(deps(), "C1", other);
    expect(find(mine, "OTDR-1")).toMatchObject({ action: "return", mine: true, borrower: "Budi" });
    expect(find(theirs, "OTDR-1")).toMatchObject({ action: "locked", mine: false, borrower: "Budi" });
  });
  it("admin only views", async () => {
    const r: any = await scanCategory(deps(), "C1", admin);
    expect(r.items.every((i: any) => i.action === "view")).toBe(true);
  });
});


describe("daftar yang sedang dipinjam", () => {
  const day = 86_400_000;
  beforeEach(() => {
    store.eq.set("A-1", { id: "E1", serial: "A-1", name: "OTDR", status: "borrowed", condition: "good", category: "OTDR", loan: { id: "L1", technicianId: "T1", technicianName: "Budi", technicianEmail: "budi@x.id", borrowedAt: new Date(Date.now() - 9 * day) } });
    store.eq.set("A-2", { id: "E2", serial: "A-2", name: "Splicer", status: "borrowed", condition: "good", category: "Fusion", loan: { id: "L2", technicianId: "T2", technicianName: "Rina", technicianEmail: "rina@x.id", borrowedAt: new Date(Date.now() - 2 * day) } });
    store.eq.set("A-3", { id: "E3", serial: "A-3", name: "OFI", status: "available", condition: "good", category: "Lain" });
  });
  it("menampilkan peminjam, kontak, lama hari, dan hanya unit yang dipinjam", async () => {
    const r = await borrowedNow(deps(), tech, new Date(), 7);
    expect(r.map((x) => x.serial)).toEqual(["A-1", "A-2"]);
    expect(r[0]).toMatchObject({ borrower: "Budi", email: "budi@x.id", days: 9, overdue: true, mine: true });
    expect(r[1]).toMatchObject({ borrower: "Rina", days: 2, overdue: false, mine: false });
  });
  it("juga bisa dilihat admin", async () => {
    expect((await borrowedNow(deps(), admin, new Date(), 7)).every((x) => x.mine === false)).toBe(true);
  });
});
