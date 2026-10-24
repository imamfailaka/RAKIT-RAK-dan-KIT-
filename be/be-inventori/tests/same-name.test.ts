import { describe, it, expect } from "vitest";
import { sameNameFilter } from "../src/services/same-name";

const matches = (f: { name: RegExp }, s: string) => f.name.test(s);

describe("sameNameFilter", () => {
  it("matches the same name regardless of letter case", () => {
    const f = sameNameFilter("Alat ukur");
    expect(matches(f, "alat ukur")).toBe(true);
    expect(matches(f, "ALAT UKUR")).toBe(true);
  });
  it("does not match a longer or different name", () => {
    const f = sameNameFilter("Alat ukur");
    expect(matches(f, "Alat ukur fiber optik")).toBe(false);
    expect(matches(f, "Sebuah Alat ukur")).toBe(false);
  });
  it("treats regex characters in the name literally", () => {
    const f = sameNameFilter("Kabel (A+B)");
    expect(matches(f, "kabel (a+b)")).toBe(true);
    expect(matches(f, "Kabel AAB")).toBe(false);
  });
  it("trims surrounding spaces and can leave one record out (for edits)", () => {
    const f = sameNameFilter("  Alat ukur  ", "abc123");
    expect(matches(f, "alat ukur")).toBe(true);
    expect(f._id).toEqual({ $ne: "abc123" });
  });
});
