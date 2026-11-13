import { describe, it, expect } from "vitest";
import { parseLocation, latestPerTechnician, onlyHolding, type LocationEntry } from "../src/services/location";

describe("parseLocation", () => {
  it("menerima koordinat valid dan membulatkan akurasi", () => {
    const r = parseLocation({ location: { lat: -6.9175, lng: 107.6191, accuracy: 12.7 } });
    expect(r).toEqual({ ok: true, location: { lat: -6.9175, lng: 107.6191, accuracy: 13 } });
  });
  it("menolak bila lokasi tidak dikirim", () => {
    const r = parseLocation({});
    expect(r.ok).toBe(false);
  });
  it("menolak koordinat di luar jangkauan atau bukan angka", () => {
    expect(parseLocation({ location: { lat: 91, lng: 0 } }).ok).toBe(false);
    expect(parseLocation({ location: { lat: 0, lng: -181 } }).ok).toBe(false);
    expect(parseLocation({ location: { lat: "x", lng: 1 } }).ok).toBe(false);
    expect(parseLocation({ location: { lat: Number.NaN, lng: 1 } }).ok).toBe(false);
  });
  it("akurasi opsional", () => {
    const r = parseLocation({ location: { lat: 1, lng: 2 } });
    expect(r).toEqual({ ok: true, location: { lat: 1, lng: 2, accuracy: undefined } });
  });
});

describe("latestPerTechnician", () => {
  const at = (h: number) => new Date(Date.UTC(2026, 10, 14, h));
  const e = (tech: string, h: number): LocationEntry => ({
    id: `${tech}-${h}`,
    technicianId: tech,
    technicianName: tech.toUpperCase(),
    event: "checkin",
    lat: h,
    lng: h,
    at: at(h),
  });
  it("mengambil posisi terbaru tiap teknisi dan menandai yang sudah lama tidak update", () => {
    const rows = latestPerTechnician([e("a", 1), e("a", 5), e("b", 2)], at(6), 3);
    expect(rows).toHaveLength(2);
    const a = rows.find((r) => r.technicianId === "a")!;
    const b = rows.find((r) => r.technicianId === "b")!;
    expect(a.lat).toBe(5);
    expect(a.stale).toBe(false);
    expect(b.stale).toBe(true);
  });
});

describe("onlyHolding (privasi)", () => {
  it("hanya menampilkan teknisi yang masih memegang alat, beserta jumlahnya", () => {
    const base = { event: "auto" as const, lat: 1, lng: 1, at: new Date(), stale: false };
    const rows = onlyHolding(
      [{ ...base, id: "1", technicianId: "a" }, { ...base, id: "2", technicianId: "b" }],
      new Map([["a", 2], ["b", 0]]),
    );
    expect(rows.map((r) => [r.technicianId, r.holding])).toEqual([["a", 2]]);
  });
});
