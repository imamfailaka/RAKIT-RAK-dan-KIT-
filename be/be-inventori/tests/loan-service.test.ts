import { describe, it, expect, beforeEach } from "vitest";
import { borrow, returnLoan, type EquipmentStore, type LoanStore, type LoanRecord, type Condition } from "../src/services/loan-service";

type Eq = { id: string; status: "available" | "borrowed"; condition: Condition };

class FakeEquipment implements EquipmentStore {
  constructor(public items: Map<string, Eq>) {}
  returnedCalls = 0;
  async find(id: string) { return this.items.get(id) ?? null; }
  async markBorrowedIfAvailable(id: string) {
    const e = this.items.get(id);
    if (!e || e.status !== "available" || e.condition !== "good") return false;
    e.status = "borrowed";
    return true;
  }
  async markReturned(id: string, condition: Condition) {
    this.returnedCalls++;
    const e = this.items.get(id)!;
    e.status = "available";
    e.condition = condition;
  }
  async revertToAvailable(id: string) { this.items.get(id)!.status = "available"; }
}

class FakeLoans implements LoanStore {
  loans = new Map<string, LoanRecord>();
  failCreate = false;
  n = 0;
  async create(l: { equipment: string; technician: string; recordedBy: string; note?: string }) {
    if (this.failCreate) throw new Error("db down");
    const rec: LoanRecord = { id: `L${++this.n}`, ...l, borrowedAt: new Date(), returnedAt: null };
    this.loans.set(rec.id, rec);
    return rec;
  }
  async find(id: string) { return this.loans.get(id) ?? null; }
  async closeIfOpen(id: string, returnCondition: Condition, note?: string) {
    const l = this.loans.get(id);
    if (!l || l.returnedAt) return null;
    l.returnedAt = new Date();
    l.returnCondition = returnCondition;
    l.note = note ?? l.note;
    return l;
  }
}

let equipment: FakeEquipment;
let loans: FakeLoans;
const technicians = { exists: async (id: string) => id === "tech1" };
const deps = () => ({ equipment, loans, technicians });
const input = { equipmentId: "E1", technicianId: "tech1", recordedBy: "admin1" };

beforeEach(() => {
  equipment = new FakeEquipment(new Map([
    ["E1", { id: "E1", status: "available", condition: "good" }],
    ["E2", { id: "E2", status: "available", condition: "broken" }],
  ]));
  loans = new FakeLoans();
});

describe("borrow", () => {
  it("lends an available, good unit and records the loan", async () => {
    const r = await borrow(deps(), input);
    expect(r.ok).toBe(true);
    expect(equipment.items.get("E1")!.status).toBe("borrowed");
    expect(loans.loans.size).toBe(1);
  });
  it("returns 409 for a unit that is already borrowed", async () => {
    await borrow(deps(), input);
    const r = await borrow(deps(), input);
    expect(r).toMatchObject({ ok: false, code: 409 });
    expect(loans.loans.size).toBe(1);
  });
  it("returns 409 for a broken unit", async () => {
    const r = await borrow(deps(), { ...input, equipmentId: "E2" });
    expect(r).toMatchObject({ ok: false, code: 409 });
    expect(loans.loans.size).toBe(0);
  });
  it("puts the unit back to available when the loan record cannot be created", async () => {
    loans.failCreate = true;
    await expect(borrow(deps(), input)).rejects.toThrow("db down");
    expect(equipment.items.get("E1")!.status).toBe("available");
  });
  it("returns 404 for an unknown technician and does not touch the unit", async () => {
    const r = await borrow(deps(), { ...input, technicianId: "ghost" });
    expect(r).toMatchObject({ ok: false, code: 404 });
    expect(equipment.items.get("E1")!.status).toBe("available");
  });
  it("returns 404 for an unknown unit", async () => {
    expect(await borrow(deps(), { ...input, equipmentId: "nope" })).toMatchObject({ ok: false, code: 404 });
  });
  it("lets exactly one of two simultaneous requests win", async () => {
    const [a, b] = await Promise.all([borrow(deps(), input), borrow(deps(), input)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(loans.loans.size).toBe(1);
  });
});

describe("returnLoan", () => {
  const lend = async () => (await borrow(deps(), input) as any).loan as LoanRecord;
  it("makes a unit returned in good condition available", async () => {
    const loan = await lend();
    const r = await returnLoan(deps(), loan.id, "good");
    expect(r.ok).toBe(true);
    expect(equipment.items.get("E1")).toMatchObject({ status: "available", condition: "good" });
  });
  it("marks a unit returned broken as broken so it cannot be lent again", async () => {
    const loan = await lend();
    await returnLoan(deps(), loan.id, "broken");
    expect(equipment.items.get("E1")!.condition).toBe("broken");
    expect(await borrow(deps(), input)).toMatchObject({ ok: false, code: 409 });
  });
  it("returns 409 on the second return and does not update the unit twice", async () => {
    const loan = await lend();
    await returnLoan(deps(), loan.id, "good");
    const again = await returnLoan(deps(), loan.id, "good");
    expect(again).toMatchObject({ ok: false, code: 409 });
    expect(equipment.returnedCalls).toBe(1);
  });
  it("returns 404 for an unknown loan and 400 for an invalid condition", async () => {
    expect(await returnLoan(deps(), "nope", "good")).toMatchObject({ ok: false, code: 404 });
    const loan = await lend();
    expect(await returnLoan(deps(), loan.id, "excellent" as any)).toMatchObject({ ok: false, code: 400 });
  });
});
