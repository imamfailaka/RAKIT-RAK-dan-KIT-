export type GeoPoint = { lat: number; lng: number; accuracy?: number };

/** Pesan yang ditampilkan ke teknisi bila GPS tidak bisa dibaca, lengkap dengan cara memperbaikinya. */
export const GEO_HELP = {
  unsupported: "Browser ini tidak mendukung lokasi. Buka aplikasi lewat Chrome/Safari di HP.",
  denied:
    "Izin lokasi ditolak. Aktifkan lagi: ketuk ikon gembok di sebelah alamat web → Izin/Lokasi → Izinkan, lalu coba lagi.",
  unavailable: "GPS belum mendapat sinyal. Nyalakan Lokasi/GPS di HP, pindah ke tempat terbuka, lalu coba lagi.",
  timeout: "Lokasi terlalu lama didapat. Pastikan GPS menyala dan internet stabil, lalu coba lagi.",
} as const;

export class GeoError extends Error {
  constructor(public kind: keyof typeof GEO_HELP) {
    super(GEO_HELP[kind]);
    this.name = "GeoError";
  }
}

/** Membaca posisi HP saat ini (akurasi tinggi). Melempar GeoError dengan pesan bahasa Indonesia. */
export function getCurrentLocation(timeoutMs = 15_000): Promise<GeoPoint> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.reject(new GeoError("unsupported"));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : undefined,
        }),
      (err) => reject(new GeoError(err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable")),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

/** true bila pengguna sudah pernah mengizinkan lokasi, sehingga bisa diambil tanpa memunculkan pop-up. */
export async function locationAlreadyAllowed(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions) return false;
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "granted";
  } catch {
    return false;
  }
}
