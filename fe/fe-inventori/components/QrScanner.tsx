"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { scanTargetPath } from "@/lib/scan";

/** Kamera di dalam aplikasi: mengenali QR kategori lalu membuka halaman pinjam. */
export default function QrScanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(() =>
    typeof navigator !== "undefined" && !navigator.mediaDevices ? "Peramban ini tidak mendukung kamera." : null,
  );
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const tick = () => {
      const v = video.current;
      if (stopped || !v) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height);
          if (code) {
            const path = scanTargetPath(code.data, window.location.origin);
            if (path) { stopped = true; router.push(path); return; }
            setWrong(true);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (video.current) { video.current.srcObject = s; void video.current.play(); }
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setError("Kamera tidak bisa dibuka. Izinkan akses kamera di peramban."));
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [router]);

  if (error) return <p role="alert" className="rounded-[14px] border border-line bg-surface p-4 text-sm text-warn">{error}</p>;
  return (
    <div className="flex flex-col gap-2">
      <video ref={video} muted playsInline aria-label="Kamera pemindai QR" className="aspect-square w-full rounded-[14px] border border-line bg-black object-cover" />
      <p className="text-sm text-muted" aria-live="polite">{wrong ? "QR ini bukan QR Rakit. Coba QR kategori alat." : "Arahkan kamera ke QR kategori alat."}</p>
    </div>
  );
}
