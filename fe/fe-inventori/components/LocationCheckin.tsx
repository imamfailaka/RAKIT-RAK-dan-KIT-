"use client";

import { useEffect, useState } from "react";
import { MapPin } from "@phosphor-icons/react";
import Button from "@/components/Button";
import { GeoError, getCurrentLocation, locationAlreadyAllowed } from "@/lib/geolocation";
import { normalizeError } from "@/lib/errors";
import { checkin } from "@/services/locations";

const KEY = "rakit:last-checkin";
/** Kirim otomatis saat aplikasi dibuka, paling sering sekali per 30 menit. */
const AUTO_EVERY_MS = 30 * 60_000;

function readLast(): Date | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}
function saveLast(d: Date) {
  try {
    localStorage.setItem(KEY, d.toISOString());
  } catch {
    /* penyimpanan browser tidak tersedia: abaikan */
  }
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const time = (d: Date) => d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Kartu check-in lokasi untuk teknisi. Bila izin lokasi sudah pernah diberikan, posisi dikirim otomatis
 * setiap kali aplikasi dibuka (maks. 1x per 30 menit); bila belum, teknisi diminta menekan tombol.
 */
export default function LocationCheckin() {
  const [last, setLast] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function send(silent = false) {
    setBusy(true);
    if (!silent) setMsg(null);
    try {
      const location = await getCurrentLocation();
      await checkin(location);
      const now = new Date();
      saveLast(now);
      setLast(now);
      setMsg({ kind: "ok", text: silent ? "Lokasi terkirim otomatis." : "Lokasi berhasil dikirim." });
    } catch (e) {
      if (silent) return;
      setMsg({ kind: "err", text: e instanceof GeoError ? e.message : normalizeError(e).message });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    const prev = readLast();
    locationAlreadyAllowed().then((allowed) => {
      if (!alive) return;
      setLast(prev);
      const recent = prev && Date.now() - prev.getTime() < AUTO_EVERY_MS;
      if (allowed && !recent) void send(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const notToday = !last || !sameDay(last, new Date());
  return (
    <section
      aria-label="Lokasi saya"
      className={`flex flex-col gap-3 rounded-[18px] border p-4 ${notToday ? "border-warn-ink/40 bg-warn-bg" : "border-line bg-surface"}`}
    >
      <div className="flex items-start gap-3">
        <MapPin size={24} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Lokasi saya</h2>
          <p className="text-sm text-muted">
            {notToday
              ? "Anda belum mengirim lokasi hari ini. Nyalakan GPS lalu tekan tombol di bawah."
              : `Terakhir terkirim ${time(last!)}.`}{" "}
            Pinjam dan kembalikan alat lewat scan juga wajib GPS aktif.
          </p>
        </div>
      </div>
      {msg && (
        <p role={msg.kind === "ok" ? "status" : "alert"} className={`text-sm font-medium ${msg.kind === "ok" ? "text-ok-ink" : "text-danger-ink"}`}>
          {msg.text}
        </p>
      )}
      <Button loading={busy} onClick={() => send(false)}>Kirim lokasi saya</Button>
    </section>
  );
}
