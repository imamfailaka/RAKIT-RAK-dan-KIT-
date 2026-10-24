import { describe, it, expect } from "vitest";
import { conditionTone, equipmentStatusTone } from "@/lib/status";

describe("status tones", () => {
  it("marks available equipment ok and borrowed equipment info", () => {
    expect(equipmentStatusTone("available")).toBe("ok");
    expect(equipmentStatusTone("borrowed")).toBe("info");
  });
  it("marks good ok, broken danger, repair warn; unknown neutral", () => {
    expect(conditionTone("good")).toBe("ok");
    expect(conditionTone("broken")).toBe("danger");
    expect(conditionTone("repair")).toBe("warn");
    expect(conditionTone("???")).toBe("neutral");
  });
});
