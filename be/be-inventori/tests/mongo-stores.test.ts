import { describe, it, expect, vi, beforeEach } from "vitest";
import EquipmentModel from "../src/models/equipment.model";
import LoanModel from "../src/models/loan.model";
import { mongoEquipmentStore } from "../src/services/equipment-store";
import { mongoLoanStore } from "../src/services/loan-store";

beforeEach(() => vi.restoreAllMocks());

describe("mongoEquipmentStore.markBorrowedIfAvailable", () => {
  it("flips the unit in ONE conditional update (status available AND condition good)", async () => {
    const spy = vi.spyOn(EquipmentModel, "findOneAndUpdate").mockResolvedValue({ _id: "E1" } as never);
    expect(await mongoEquipmentStore.markBorrowedIfAvailable("E1")).toBe(true);
    expect(spy).toHaveBeenCalledWith({ _id: "E1", status: "available", condition: "good" }, { status: "borrowed" });
  });
  it("reports false when nothing matched (lost the race or unit unfit)", async () => {
    vi.spyOn(EquipmentModel, "findOneAndUpdate").mockResolvedValue(null as never);
    expect(await mongoEquipmentStore.markBorrowedIfAvailable("E1")).toBe(false);
  });
});

describe("mongoLoanStore.closeIfOpen", () => {
  it("closes only a loan whose returnedAt is still null", async () => {
    const spy = vi.spyOn(LoanModel, "findOneAndUpdate").mockReturnValue({
      lean: async () => ({ _id: "L1", equipment: "E1", technician: "T1", recordedBy: "A1", borrowedAt: new Date(), returnedAt: new Date() }),
    } as never);
    await mongoLoanStore.closeIfOpen("L1", "good");
    expect(spy.mock.calls[0][0]).toEqual({ _id: "L1", returnedAt: null });
  });
  it("returns null when it was already closed", async () => {
    vi.spyOn(LoanModel, "findOneAndUpdate").mockReturnValue({ lean: async () => null } as never);
    expect(await mongoLoanStore.closeIfOpen("L1", "good")).toBeNull();
  });
});
