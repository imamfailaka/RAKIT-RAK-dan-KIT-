"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR dibuat di peramban (tanpa layanan luar). Hitam di atas putih supaya terbaca pemindai. */
export default function QrCode({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: "M" })
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={label} width={size} height={size} className="rounded-md bg-white" /> : <div style={{ width: size, height: size }} className="animate-pulse rounded-md bg-surface-alt" />;
}
