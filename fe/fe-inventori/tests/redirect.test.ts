import { describe, it, expect } from "vitest";
import { safeNext } from "@/lib/redirect";

describe("safeNext", () => {
  it("keeps a same-site path", () => {
    expect(safeNext("/admin/equipment", "admin")).toBe("/admin/equipment");
  });
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil", ""])(
    "falls back for the unsafe value %s",
    (v) => {
      expect(safeNext(v, "technician")).toBe("/my/scan");
    },
  );
  it("falls back to each role's home without next", () => {
    expect(safeNext(null, "admin")).toBe("/admin");
    expect(safeNext(null, "technician")).toBe("/my/scan");
  });
});
