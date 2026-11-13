"use client";

import LocationCheckin from "@/components/LocationCheckin";
import TrackerSetup from "@/components/TrackerSetup";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { getTracker } from "@/services/locations";

/**
 * Bagian lokasi di halaman teknisi. Privasi: check-in (termasuk kirim otomatis saat web dibuka) hanya
 * muncul selama teknisi memegang alat; setelah semua alat kembali, lokasi tidak lagi dikirim maupun disimpan.
 */
export default function FieldTracking() {
  const { state, retry } = useAsync(getTracker, "tracker");
  if (state.status === "loading") return <Skeleton count={1} />;
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-danger-ink">
        Status tracking gagal dimuat. <button className="underline" onClick={retry}>Coba lagi</button>
      </p>
    );
  }
  const { deviceId, holding } = state.data;
  return (
    <div className="flex flex-col gap-4">
      {holding > 0 && <LocationCheckin />}
      <TrackerSetup initialDeviceId={deviceId} holding={holding} />
    </div>
  );
}
