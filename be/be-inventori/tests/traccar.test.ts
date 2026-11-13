import { describe, it, expect } from "vitest";
import { newTrackerId, parseTraccar } from "../src/services/traccar";

const NOW = new Date("2026-11-14T08:00:00Z");

describe("parseTraccar", () => {
  it("membaca format JSON Traccar Client versi baru", () => {
    const r = parseTraccar({}, {
      device_id: "trk_abc",
      location: { timestamp: "2026-11-14T07:59:00Z", coords: { latitude: -6.91, longitude: 107.61, accuracy: 9.6 }, battery: { level: 0.8 } },
    }, NOW);
    expect(r).toEqual({ deviceId: "trk_abc", location: { lat: -6.91, lng: 107.61, accuracy: 10 }, at: new Date("2026-11-14T07:59:00Z") });
  });
  it("membaca format OsmAnd (query string) versi lama, termasuk timestamp detik", () => {
    const r = parseTraccar({ id: "trk_abc", lat: "-6.91", lon: "107.61", accuracy: "15", timestamp: "1794643140" }, {}, NOW);
    expect(r?.deviceId).toBe("trk_abc");
    expect(r?.location).toEqual({ lat: -6.91, lng: 107.61, accuracy: 15 });
    expect(r?.at.toISOString()).toBe("2026-11-14T07:59:00.000Z");
  });
  it("menolak data tanpa id atau koordinat tidak valid", () => {
    expect(parseTraccar({ lat: "1", lon: "2" }, {}, NOW)).toBeNull();
    expect(parseTraccar({ id: "x", lat: "abc", lon: "2" }, {}, NOW)).toBeNull();
    expect(parseTraccar({ id: "x", lat: "95", lon: "2" }, {}, NOW)).toBeNull();
  });
  it("waktu di masa depan atau terlalu lama diganti waktu server", () => {
    const future = parseTraccar({ id: "x", lat: "1", lon: "2", timestamp: "2030-01-01T00:00:00Z" }, {}, NOW);
    expect(future?.at).toEqual(NOW);
    const old = parseTraccar({ id: "x", lat: "1", lon: "2", timestamp: "2026-01-01T00:00:00Z" }, {}, NOW);
    expect(old?.at).toEqual(NOW);
  });
});

describe("newTrackerId", () => {
  it("acak, berawalan trk_, dan cukup panjang", () => {
    const a = newTrackerId();
    expect(a).toMatch(/^trk_[a-z0-9]{20}$/);
    expect(newTrackerId()).not.toBe(a);
  });
});
