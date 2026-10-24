"use client";

import Badge from "@/components/Badge";
import ErrorState from "@/components/ErrorState";
import SessionExpired from "@/components/SessionExpired";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { dateOrDash } from "@/lib/labels";
import { listBorrowed } from "@/services/scan";

/** Siapa memegang alat apa saat ini, supaya unit yang lupa dikembalikan bisa ditagih sesama teknisi. */
export default function BorrowedPage() {
  const { state, retry } = useAsync(() => listBorrowed(), "borrowed");
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sedang dipinjam</h1>
      <p className="text-sm text-muted">Hubungi peminjam bila alat belum kembali ke cabang.</p>
      {state.status === "loading" && <Skeleton count={3} />}
      {state.status === "error" && (state.error.kind === "session" ? <SessionExpired /> : <ErrorState message={state.error.message} onRetry={retry} />)}
      {state.status === "ready" && state.data.length === 0 && <p className="rounded-[14px] border border-line bg-surface p-4 text-sm text-muted">Tidak ada alat yang sedang dipinjam.</p>}
      {state.status === "ready" && state.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {state.data.map((b) => (
            <li key={b.serial} className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{b.name}</span>
                {b.overdue ? <Badge tone="danger">Terlambat</Badge> : <Badge tone="info">Dipinjam</Badge>}
              </div>
              <p className="text-xs text-muted">{b.category ? `${b.category} · ` : ""}{b.serial}</p>
              <p className="text-sm">
                <span className="font-semibold">{b.mine ? "Anda" : b.borrower ?? "-"}</span>
                {b.mine && b.borrower ? <span className="text-muted"> ({b.borrower})</span> : null}
                {!b.mine && b.email ? <> · <a className="text-accent underline" href={`mailto:${b.email}`}>{b.email}</a></> : null}
              </p>
              <p className="text-xs text-muted">Sejak {dateOrDash(b.borrowedAt)} · {b.days} hari</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
