import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";

describe("BRAND", () => {
  it("wordmark (lead + accent) sama dengan nama aplikasi", () => {
    expect((BRAND.wordmark.lead + BRAND.wordmark.accent).toLowerCase()).toBe(BRAND.app.toLowerCase());
  });

  it("tags berisi tepat RAK dan KIT", () => {
    expect([...BRAND.tags]).toEqual(["RAK", "KIT"]);
  });

  it("nama aplikasi adalah Rakit dan perusahaan tidak berubah", () => {
    expect(BRAND.app).toBe("Rakit");
    expect(BRAND.company).toBe("PT. Supra Primatama Nusantara");
  });
});
