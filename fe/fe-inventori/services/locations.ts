import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { GeoPoint } from "@/lib/geolocation";

export type LocationEvent = "borrow" | "return" | "checkin";
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
  at: string;
};
export type LatestPosition = LocationEntry & { stale: boolean };
export type LocationOverview = { latest: LatestPosition[]; history: LocationEntry[]; staleHours: number };

export const EVENT_LABEL: Record<LocationEvent, string> = { borrow: "Pinjam", return: "Kembali", checkin: "Check-in" };

/** Teknisi mengirim posisi HP saat ini. */
export async function checkin(location: GeoPoint): Promise<{ id: string; at: string }> {
  return (await apiFetch<{ id: string; at: string }>("/locations/checkin", { method: "POST", token: getToken(), body: JSON.stringify({ location }) })).data;
}

/** Admin: posisi terakhir tiap teknisi dan riwayat lokasi. */
export async function listLocations(days = 7): Promise<LocationOverview> {
  return (await apiFetch<LocationOverview>("/locations", { token: getToken(), query: { days } })).data;
}
