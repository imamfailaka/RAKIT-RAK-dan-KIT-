import { randomBytes } from "crypto";
import { parseLocation, type GeoPoint } from "./location";

export type TraccarPoint = { deviceId: string; location: GeoPoint; at: Date };

/** Titik yang tertahan di HP (offline) diterima sampai 7 hari ke belakang. */
const MAX_AGE_MS = 7 * 86_400_000;
const MAX_FUTURE_MS = 5 * 60_000;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const toNum = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : undefined);

function toDate(v: unknown, now: Date): Date {
  let d: Date | undefined;
  const n = toNum(v);
  if (n !== undefined && Number.isFinite(n)) d = new Date(n < 1e12 ? n * 1000 : n); // detik atau milidetik
  else if (typeof v === "string") d = new Date(v);
  if (!d || Number.isNaN(d.getTime())) return now;
  const diff = d.getTime() - now.getTime();
  return diff > MAX_FUTURE_MS || -diff > MAX_AGE_MS ? now : d;
}

/**
 * Membaca kiriman aplikasi Traccar Client. Mendukung dua format:
 * - JSON (versi baru): `{ device_id, location: { timestamp, coords: { latitude, longitude, accuracy } } }`
 * - OsmAnd (versi lama): query/form `?id=&lat=&lon=&accuracy=&timestamp=`
 */
export function parseTraccar(query: Record<string, unknown>, body: unknown, now: Date): TraccarPoint | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, any>;
  const json = b.location && typeof b.location === "object" ? b.location : null;
  const deviceId = str(b.device_id) ?? str(query.id) ?? str(query.deviceid) ?? str(b.id);
  if (!deviceId) return null;
  const raw = json
    ? { lat: toNum(json.coords?.latitude), lng: toNum(json.coords?.longitude), accuracy: toNum(json.coords?.accuracy) }
    : { lat: toNum(query.lat ?? b.lat), lng: toNum(query.lon ?? b.lon), accuracy: toNum(query.accuracy ?? b.accuracy) };
  const p = parseLocation({ location: raw });
  if (!p.ok) return null;
  return { deviceId, location: p.location, at: toDate(json ? json.timestamp : query.timestamp ?? b.timestamp, now) };
}

/** ID perangkat untuk Traccar Client; berfungsi sebagai kunci rahasia, jadi harus acak. */
export function newTrackerId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(20);
  let id = "";
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return `trk_${id}`;
}
