"use client";

import Link from "next/link";
import Button from "@/components/Button";
import ErrorState from "@/components/ErrorState";
import QrCode from "@/components/QrCode";
import SessionExpired from "@/components/SessionExpired";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { categoryScanUrl } from "@/lib/scan";
import { listCategories } from "@/services/categories";

/** Lembar cetak: satu QR besar per kategori. Tombol dan menu tidak ikut tercetak. */
export default function CategoryQrSheet() {
  const { state, retry } = useAsync(() => listCategories(), "cat-qr");
  if (state.status === "loading") return <Skeleton count={3} />;
  if (state.status === "error") {
    return state.error.kind === "session" ? <SessionExpired /> : <ErrorState message={state.error.message} onRetry={retry} />;
  }
  const origin = window.location.origin;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Cetak QR kategori</h1>
          <p className="text-sm text-muted">Tempel QR di tempat penyimpanan tiap kategori. Teknisi memindai, memilih unit yang tersedia, lalu meminjam atau mengembalikan.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/categories" className="inline-flex min-h-11 items-center rounded-[14px] border border-line-strong px-4 text-sm hover:bg-surface-alt">Kembali</Link>
          <Button onClick={() => window.print()}>Cetak</Button>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {state.data.map((c) => (
          <li key={c._id} className="flex break-inside-avoid flex-col items-center gap-2 rounded-[14px] border border-line bg-surface p-6 text-center print:border-black print:bg-white print:text-black">
            <QrCode value={categoryScanUrl(origin, c._id)} size={220} label={`QR kategori ${c.name}`} />
            <p className="text-xl font-semibold">{c.name}</p>
            <p className="text-xs text-muted print:text-black">Pindai untuk pinjam atau kembalikan</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
