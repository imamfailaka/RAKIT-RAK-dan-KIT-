"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ErrorState from "@/components/ErrorState";
import LogoMark from "@/components/LogoMark";
import Skeleton from "@/components/Skeleton";
import { clearToken, decodeToken, getToken } from "@/lib/auth";
import { useAsync } from "@/hooks/useAsync";
import { normalizeError } from "@/lib/errors";
import { CONDITION_LABEL, dateOrDash } from "@/lib/labels";
import { categoryScanPath } from "@/lib/scan";
import { homeFor } from "@/lib/redirect";
import { conditionTone } from "@/lib/status";
import type { Condition } from "@/services/equipment";
import { getCategoryScan, scanBorrow, scanReturn, type CategoryScanItem } from "@/services/scan";

/**
 * Tujuan QR kategori: daftar unit dengan statusnya. Unit tersedia punya tombol Pinjam; unit yang dipinjam
 * terkunci (tidak bisa diklik) kecuali oleh peminjamnya, yang mendapat tombol Kembalikan. Pinjam dan kembali
 * hanya terjadi lewat klik teknisi (POST), tidak pernah lewat membuka halaman.
 */
export default function CategoryScanView({ id }: { id: string }) {
  const router = useRouter();
  const { state, retry: load } = useAsync(() => getCategoryScan(id), `scan-${id}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("good");

  const toLogin = () => {
    clearToken();
    router.replace(`/auth/login?next=${encodeURIComponent(categoryScanPath(id))}`);
  };
  const expired = state.status === "error" && state.error.kind === "session";
  useEffect(() => {
    if (expired) {
      clearToken();
      router.replace(`/auth/login?next=${encodeURIComponent(categoryScanPath(id))}`);
    }
  }, [expired, id, router]);

  async function run(item: CategoryScanItem, fn: () => Promise<unknown>, ok: string) {
    setBusy(item.serial);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: "ok", text: ok });
      setReturning(null);
    } catch (e) {
      const error = normalizeError(e);
      if (error.kind === "session") return toLogin();
      setMsg({ kind: "err", text: error.message });
    } finally {
      setBusy(null);
      load();
    }
  }

  const home = homeFor(decodeToken(getToken() ?? "")?.role);
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-muted"><LogoMark size={28} /> Pindai alat</div>
      {state.status === "loading" && <Skeleton count={3} />}
      {state.status === "error" && !expired && (
        <ErrorState message={state.error.kind === "notfound" ? "Kategori tidak ditemukan." : state.error.message} onRetry={state.error.kind === "notfound" ? undefined : load} />
      )}
      {state.status === "ready" && (
        <>
          <h1 className="text-2xl font-semibold">{state.data.category.name}</h1>
          {msg && (
            <p role={msg.kind === "ok" ? "status" : "alert"} className={`rounded-[14px] border bg-surface p-3 text-sm font-medium ${msg.kind === "ok" ? "border-ok-ink/30 text-ok-ink" : "border-danger-ink/30 text-danger-ink"}`}>
              {msg.text}
            </p>
          )}
          {state.data.items.length === 0 && <p className="text-sm text-muted">Belum ada alat di kategori ini.</p>}
          <ul className="flex flex-col gap-3">
            {state.data.items.map((it) => (
              <li key={it.id} className="rounded-[14px] border border-line bg-surface p-4">
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-muted">{it.serial}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={it.status === "available" ? "ok" : "info"}>{it.status === "available" ? "Tersedia" : "Dipinjam"}</Badge>
                  <Badge tone={conditionTone(it.condition)}>{CONDITION_LABEL[it.condition]}</Badge>
                </div>
                {it.status === "borrowed" && (
                  <p className="mt-2 text-sm text-muted">
                    Dipinjam {it.mine ? "oleh Anda" : it.borrower ? `oleh ${it.borrower}` : ""} sejak {dateOrDash(it.borrowedAt)}
                  </p>
                )}
                <div className="mt-3">
                  {it.action === "borrow" && (
                    <Button loading={busy === it.serial} onClick={() => run(it, () => scanBorrow(it.serial), `${it.name} (${it.serial}) berhasil dipinjam atas nama Anda.`)}>Pinjam</Button>
                  )}
                  {it.action === "return" && returning !== it.serial && <Button variant="secondary" onClick={() => setReturning(it.serial)}>Kembalikan</Button>}
                  {it.action === "return" && returning === it.serial && (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col gap-1 text-sm">
                        Kondisi saat dikembalikan
                        <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className="h-12 rounded-[14px] border border-line-strong bg-canvas px-3.5 text-[15px]">
                          {(["good", "broken", "repair"] as const).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
                        </select>
                      </label>
                      <Button loading={busy === it.serial} onClick={() => run(it, () => scanReturn(it.serial, { returnCondition: condition }), `${it.name} (${it.serial}) dikembalikan.`)}>Konfirmasi kembalikan</Button>
                    </div>
                  )}
                  {it.action === "locked" && (
                    <Button disabled aria-disabled="true">
                      {it.status === "borrowed" ? "Sedang dipinjam" : "Tidak bisa dipinjam"}
                    </Button>
                  )}
                  {it.action === "view" && <p className="text-xs text-muted">Admin hanya melihat. Pinjam dan kembali khusus akun teknisi.</p>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link href={home} className="text-sm text-accent underline">Kembali ke beranda</Link>
    </main>
  );
}
