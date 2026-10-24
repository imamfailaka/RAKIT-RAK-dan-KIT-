import { describe, it, expect } from "vitest";
import { computeDashboard } from "../src/services/dashboard-service";

const now = new Date("2026-10-24T00:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86400000);
const cfg = { overdueDays: 7, calibrationDays: 30 };
const empty = { equipment: [], openLoans: [] };

describe("computeDashboard", () => {
  it("returns zeros for empty data", () => {
    const d = computeDashboard(empty, now, cfg);
    expect(d.equipmentByStatus).toEqual({ available: 0, borrowed: 0 });
    expect(d.equipmentByCondition).toEqual({ good: 0, broken: 0, repair: 0 });
    expect([d.activeLoans, d.overdueLoans.length, d.calibrationDue.length]).toEqual([0, 0, 0]);
  });
  it("counts equipment by status and condition", () => {
    const d = computeDashboard({ ...empty, equipment: [
      { status: "available", condition: "good" },
      { status: "borrowed", condition: "good" },
      { status: "available", condition: "broken" },
    ] }, now, cfg);
    expect(d.equipmentByStatus).toEqual({ available: 2, borrowed: 1 });
    expect(d.equipmentByCondition).toEqual({ good: 2, broken: 1, repair: 0 });
  });
  it("treats a loan older than 7 days as overdue but not one of 6 days", () => {
    const d = computeDashboard({ ...empty, openLoans: [{ borrowedAt: days(-8) }, { borrowedAt: days(-6) }] }, now, cfg);
    expect(d.activeLoans).toBe(2);
    expect(d.overdueLoans).toHaveLength(1);
  });
  it("ignores units without a calibration date and does not fail", () => {
    const d = computeDashboard({ ...empty, equipment: [{ status: "available", condition: "good", nextCalibration: null }, { status: "available", condition: "good" }] }, now, cfg);
    expect(d.calibrationDue).toHaveLength(0);
  });
  it("flags calibration that is overdue or due within 30 days but not later", () => {
    const d = computeDashboard({ ...empty, equipment: [
      { status: "available", condition: "good", nextCalibration: days(-3) },
      { status: "available", condition: "good", nextCalibration: days(30) },
      { status: "available", condition: "good", nextCalibration: days(31) },
    ] }, now, cfg);
    expect(d.calibrationDue).toHaveLength(2);
  });
  it("groups equipment per category, biggest first, unknown last label", () => {
    const d = computeDashboard({ ...empty, equipment: [
      { status: "available", condition: "good", category: { name: "Alat ukur" } },
      { status: "available", condition: "good", category: { name: "Alat ukur" } },
      { status: "borrowed", condition: "good", category: { name: "Alat kerja" } },
      { status: "available", condition: "good", category: null },
    ] }, now, cfg);
    expect(d.equipmentByCategory).toEqual([
      { name: "Alat ukur", count: 2 },
      { name: "Alat kerja", count: 1 },
      { name: "Tanpa kategori", count: 1 },
    ]);
  });
  it("does not crash on an unexpected status value", () => {
    expect(() => computeDashboard({ ...empty, equipment: [{ status: "weird" as any, condition: "good" }] }, now, cfg)).not.toThrow();
  });
});
