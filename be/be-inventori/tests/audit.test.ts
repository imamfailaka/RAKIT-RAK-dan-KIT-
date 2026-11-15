import { describe, it, expect, vi } from "vitest";
import { describeChanges, writeAudit, conditionLabel } from "../src/services/audit";
import { auditQuery } from "../src/controllers/audit.controller";

describe("describeChanges", () => {
  const fields = [
    { key: "name", label: "nama" },
    { key: "isActive", label: "status", format: (v: any) => (v === false ? "nonaktif" : "aktif") },
  ];
  it("hanya mencantumkan field yang benar-benar berubah", () => {
    expect(describeChanges({ name: "Budi", isActive: true }, { name: "Budi", isActive: false }, fields)).toBe("status: aktif → nonaktif");
  });
  it("mengabaikan field yang tidak dikirim", () => {
    expect(describeChanges({ name: "Budi", isActive: true }, { name: "Budi S" }, fields)).toBe("nama: Budi → Budi S");
  });
  it("kosong bila tidak ada data sebelumnya", () => {
    expect(describeChanges(null, { name: "x" }, fields)).toBe("");
  });
});

describe("writeAudit", () => {
  it("tidak pernah melempar error walau penyimpanan gagal (aksi utama tetap jalan)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(writeAudit({ action: "auth.login" }, async () => { throw new Error("db down"); })).resolves.toBeUndefined();
    spy.mockRestore();
  });
  it("meneruskan catatan ke penyimpan", async () => {
    const w = vi.fn(async () => {});
    await writeAudit({ action: "user.delete", target: { type: "user", label: "Budi" } }, w);
    expect(w).toHaveBeenCalledWith({ action: "user.delete", target: { type: "user", label: "Budi" } });
  });
});

describe("auditQuery", () => {
  it("filter grup hanya menerima grup yang dikenal", () => {
    expect(auditQuery({ group: "user" }).action).toEqual(/^user\./);
    expect(auditQuery({ group: "$where" }).action).toBeUndefined();
  });
  it("kata kunci di-escape (aman dari regex injection)", () => {
    const q: any = auditQuery({ search: "a.*" });
    expect(q.$or[0].actorName.source).toBe("a\\.\\*");
  });
});

it("label kondisi berbahasa Indonesia", () => {
  expect(conditionLabel("broken")).toBe("Rusak");
  expect(conditionLabel(undefined)).toBe("-");
});
