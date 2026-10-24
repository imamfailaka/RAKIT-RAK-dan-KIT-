import { describe, it, expect } from "vitest";
import { equipmentDTO } from "../src/models/equipment.model";
import { categoryDTO } from "../src/models/category.model";

const rejects = async (p: Promise<unknown>) => { await expect(p).rejects.toBeTruthy(); };

describe("equipmentDTO", () => {
  it("rejects an empty serial", async () => {
    await rejects(equipmentDTO.validate({ serial: "  ", name: "OTDR", category: "c1" }));
  });
  it("accepts a valid unit with an empty calibration date", async () => {
    await expect(equipmentDTO.validate({ serial: "S1", name: "OTDR", category: "c1" })).resolves.toBeTruthy();
  });
});

describe("categoryDTO", () => {
  it("requires a name", async () => {
    await rejects(categoryDTO.validate({ name: "" }));
    await expect(categoryDTO.validate({ name: "A" })).resolves.toBeTruthy();
  });
});
