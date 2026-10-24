import { describe, it, expect } from "vitest";
import { categoryDTO } from "../src/models/category.model";
import { STARTER_CATEGORIES } from "../src/data/starter-catalog";

describe("starter catalog", () => {
  it("has a handful of unique, valid equipment categories and nothing about consumables", async () => {
    const names = STARTER_CATEGORIES.map((c) => c.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(3);
    for (const n of names) expect(n).not.toMatch(/aksesori|kabel|stok|bahan/);
    for (const c of STARTER_CATEGORIES) await expect(categoryDTO.validate(c)).resolves.toBeTruthy();
  });
});
