"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import QrCode from "@/components/QrCode";
import { categoryScanUrl } from "@/lib/scan";

/** Tombol "QR" di baris kategori: menampilkan QR kategori itu. */
export default function QrLink({ categoryId, name }: { categoryId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const url = typeof window === "undefined" ? "" : categoryScanUrl(window.location.origin, categoryId);
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)} aria-label={`QR ${name}`}>
        QR
      </Button>
      {open && (
        <Modal title={`QR ${name}`} onClose={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-3">
            <QrCode value={url} size={240} label={`QR kategori ${name}`} />
            <p className="text-sm font-medium">{name}</p>
            <p className="max-w-full break-all text-xs text-muted">{url}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Tutup</Button>
              <Link href="/admin/categories/qr" className="inline-flex min-h-11 items-center rounded-[14px] bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover">Halaman cetak</Link>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
