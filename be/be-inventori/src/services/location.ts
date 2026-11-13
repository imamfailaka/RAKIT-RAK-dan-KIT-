export type GeoPoint = { lat: number; lng: number; accuracy?: number };
export type LocationEvent = "borrow" | "return" | "checkin" | "auto";

export type LocationEntry = {
  id: string;
  technicianId: string;
  technicianName?: string;
  event: LocationEvent;
  serial?: string;
  equipmentName?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  at: Date;
};

export const LOCATION_REQUIRED = "lokasi wajib diaktifkan";

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Membaca `body.location` dari HP teknisi; koordinat wajib ada dan masuk akal. */
export function parseLocation(body: unknown): { ok: true; location: GeoPoint } | { ok: false; message: string } {
  const loc = (body as { location?: Record<string, unknown> } | null | undefined)?.location;
  if (!loc || typeof loc !== "object") return { ok: false, message: LOCATION_REQUIRED };
  const { lat, lng, accuracy } = loc;
  if (!num(lat) || !num(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, message: "koordinat lokasi tidak valid" };
  }
  return { ok: true, location: { lat, lng, accuracy: num(accuracy) && accuracy >= 0 ? Math.round(accuracy) : undefined } };
}

export type LatestPosition = LocationEntry & { stale: boolean };

/** Posisi terakhir tiap teknisi; `stale` bila lebih dari `staleHours` jam tidak ada update. */
export function latestPerTechnician(entries: LocationEntry[], now: Date, staleHours: number): LatestPosition[] {
  const latest = new Map<string, LocationEntry>();
  for (const e of entries) {
    const cur = latest.get(e.technicianId);
    if (!cur || new Date(e.at).getTime() > new Date(cur.at).getTime()) latest.set(e.technicianId, e);
  }
  const limit = staleHours * 3_600_000;
  return [...latest.values()]
    .map((e) => ({ ...e, stale: now.getTime() - new Date(e.at).getTime() > limit }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export type ActivePosition = LatestPosition & { holding: number };

/**
 * Privasi: hanya teknisi yang sedang memegang alat yang tampil sebagai posisi terkini.
 * Setelah semua alat dikembalikan, teknisi hilang dari peta langsung.
 */
export function onlyHolding(latest: LatestPosition[], holding: Map<string, number>): ActivePosition[] {
  return latest.filter((p) => (holding.get(p.technicianId) ?? 0) > 0).map((p) => ({ ...p, holding: holding.get(p.technicianId)! }));
}
