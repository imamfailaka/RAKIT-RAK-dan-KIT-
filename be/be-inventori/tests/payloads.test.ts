import { describe, it, expect } from "vitest";
import { buildCategoryPayload, buildEquipmentPayload } from "../src/services/payloads";

describe("buildEquipmentPayload", () => {
  it("ignores status, loan fields and unknown fields from the client", () => {
    const p: any = buildEquipmentPayload({ serial: "S1", name: "OTDR", category: "c1", status: "borrowed", _id: "x", borrowedBy: "u1", condition: "repair" });
    expect(p.status).toBeUndefined();
    expect(p._id).toBeUndefined();
    expect(p.borrowedBy).toBeUndefined();
    expect(p).toMatchObject({ serial: "S1", name: "OTDR", category: "c1", condition: "repair" });
  });
  it("drops an unknown condition value", () => {
    expect((buildEquipmentPayload({ condition: "excellent" }) as any).condition).toBeUndefined();
  });
});

describe("buildCategoryPayload", () => {
  it("keeps the name only", () => {
    expect(buildCategoryPayload({ name: "OTDR", kind: "stock", x: 1 })).toEqual({ name: "OTDR" });
  });
});
