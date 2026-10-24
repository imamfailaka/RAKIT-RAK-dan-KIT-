import { describe, it, expect } from "vitest";
import CategoryModel from "../src/models/category.model";

describe("Category name uniqueness", () => {
  it("has a unique name index that ignores letter case (collation strength 2)", () => {
    const idx = (CategoryModel as any).schema.indexes().find(([keys]: any[]) => keys.name === 1);
    expect(idx).toBeDefined();
    expect(idx[1]).toMatchObject({ unique: true, collation: { strength: 2 } });
  });
});
