"use client";

import Link from "next/link";
import ErrorState from "@/components/ErrorState";
import SessionExpired from "@/components/SessionExpired";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { categoryScanPath } from "@/lib/scan";
import { listCategories } from "@/services/categories";

/** Cadangan tanpa kamera: pilih kategori, sama dengan memindai QR-nya. */
export default function MyScanPage() {
  const { state, retry } = useAsync(() => listCategories(), "my-scan");
  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Pindai alat</h1>
      <p className="text-sm text-muted">Cara cepat: buka kamera ponsel, arahkan ke QR kategori, lalu ketuk tautan yang muncul. Tanpa kamera, pilih kategori di bawah.</p>
      {state.status === "loading" && <Skeleton count={3} />}
      {state.status === "error" && (state.error.kind === "session" ? <SessionExpired /> : <ErrorState message={state.error.message} onRetry={retry} />)}
      {state.status === "ready" && (
        <ul className="flex flex-col gap-2">
          {state.data.map((c) => (
            <li key={c._id}>
              <Link href={categoryScanPath(c._id)} className="flex min-h-12 items-center rounded-[14px] border border-line bg-surface px-4 font-medium hover:bg-surface-alt">{c.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
