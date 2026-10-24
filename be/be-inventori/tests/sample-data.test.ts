import { describe, it, expect } from "vitest";
import { equipmentDTO } from "../src/models/equipment.model";
import { STARTER_CATEGORIES } from "../src/data/starter-catalog";
import { INITIAL_EQUIPMENT } from "../src/data/sample-data";

const cats = STARTER_CATEGORIES.map((c) => c.name);
const count = (cat: string) => INITIAL_EQUIPMENT.filter((e) => e.category === cat).length;

describe("daftar alat Biznet Duri Pulo", () => {
  it("tiga kategori: OTDR, Mesin Fusion Splicer, Lain-lain", () => {
    expect(cats).toEqual(["OTDR", "Mesin Fusion Splicer", "Lain-lain"]);
  });
  it("jumlah unit sesuai daftar: 2 OTDR, 10 splicer, 2 lain-lain", () => {
    expect([count("OTDR"), count("Mesin Fusion Splicer"), count("Lain-lain")]).toEqual([2, 10, 2]);
  });
  it("serial unik, aman di URL, dan tiap alat menunjuk kategori yang ada", () => {
    const serials = INITIAL_EQUIPMENT.map((e) => e.serial);
    expect(new Set(serials).size).toBe(serials.length);
    for (const e of INITIAL_EQUIPMENT) {
      expect(e.serial).toMatch(/^[A-Za-z0-9._-]+$/);
      expect(cats).toContain(e.category);
    }
  });
  it("hanya AI8 V01J20120899 dan FITEL yang rusak", () => {
    expect(INITIAL_EQUIPMENT.filter((e) => e.condition === "broken").map((e) => e.serial).sort()).toEqual(["FITEL-01", "V01J20120899"]);
  });
  it("lolos validasi yang sama dengan API", async () => {
    for (const e of INITIAL_EQUIPMENT) await expect(equipmentDTO.validate({ ...e, category: "id" })).resolves.toBeTruthy();
  });
});
