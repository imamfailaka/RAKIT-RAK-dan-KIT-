"use client";

import { useState } from "react";
import { Broadcast } from "@phosphor-icons/react";
import Button from "@/components/Button";
import { useAsync } from "@/hooks/useAsync";
import { normalizeError } from "@/lib/errors";
import { createTracker, getTracker, traccarServerUrl } from "@/services/locations";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm">{value}</code>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard diblokir: teks tetap bisa disalin manual */
            }
          }}
        >
          {copied ? "Tersalin" : "Salin"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Panduan memasang aplikasi gratis Traccar Client agar lokasi terkirim otomatis di latar belakang
 * (walau web tidak dibuka). ID perangkat dibuat per teknisi dan berfungsi sebagai kunci.
 */
export default function TrackerSetup() {
  const { state, retry } = useAsync(getTracker, "tracker");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  const deviceId = fresh ?? (state.status === "ready" ? state.data.deviceId : null);

  async function make() {
    if (deviceId && !confirm("Buat ID baru? ID lama langsung tidak berlaku dan aplikasi di HP harus diisi ulang.")) return;
    setBusy(true);
    setErr(null);
    try {
      setFresh((await createTracker()).deviceId);
    } catch (e) {
      setErr(normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Tracking otomatis" className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Broadcast size={24} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Tracking otomatis (aplikasi Traccar Client)</h2>
          <p className="text-sm text-muted">Lokasi terkirim otomatis selama jam kerja, walau web tidak dibuka. Aplikasinya gratis.</p>
        </div>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger-ink">
          {state.error.message} <button className="underline" onClick={retry}>Coba lagi</button>
        </p>
      )}
      {err && <p role="alert" className="text-sm text-danger-ink">{err}</p>}

      {state.status === "ready" && !deviceId && (
        <Button loading={busy} onClick={make}>Buat ID perangkat saya</Button>
      )}

      {deviceId && (
        <>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            <li>Pasang <b>Traccar Client</b> dari Play Store / App Store.</li>
            <li>
              Buka pengaturan aplikasi, isi:
              <div className="mt-2 flex flex-col gap-2">
                <CopyField label="Server URL" value={traccarServerUrl()} />
                <CopyField label="Device identifier" value={deviceId} />
              </div>
            </li>
            <li>Atur <b>Frequency</b> 300 detik (5 menit) dan <b>Location accuracy</b> High.</li>
            <li>Izinkan lokasi <b>&quot;Selalu&quot; / &quot;Allow all the time&quot;</b>, lalu matikan penghemat baterai untuk Traccar Client.</li>
            <li>Tekan <b>Start</b> saat mulai kerja dan <b>Stop</b> setelah jam kerja selesai.</li>
          </ol>
          <p className="text-xs text-muted">ID perangkat bersifat rahasia, jangan dibagikan. Bila HP hilang atau ganti HP, buat ID baru.</p>
          <Button variant="secondary" loading={busy} onClick={make}>Buat ID baru</Button>
        </>
      )}
    </section>
  );
}
