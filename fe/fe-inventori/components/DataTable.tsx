"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import Modal from "@/components/Modal";
import Skeleton from "@/components/Skeleton";

export type Column<T> = { header: string; render: (row: T) => ReactNode; /** Right-align and use even-width digits. */ numeric?: boolean };

export default function DataTable<T extends { _id: string }>({
  columns,
  rows,
  status,
  errorMessage,
  onRetry,
  onEdit,
  onDelete,
  rowActions,
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[];
  status: "loading" | "error" | "ready";
  errorMessage?: string;
  onRetry?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  emptyMessage?: string;
}) {
  const [toDelete, setToDelete] = useState<T | null>(null);

  if (status === "loading") return <Skeleton count={3} />;
  if (status === "error") return <ErrorState message={errorMessage ?? "Gagal memuat data."} onRetry={onRetry} />;
  if (rows.length === 0) return <EmptyState message={emptyMessage ?? "Belum ada data."} />;

  const hasActions = Boolean(onEdit || onDelete || rowActions);
  return (
    <>
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="w-full text-left text-sm max-md:block">
          <thead className="bg-surface-alt text-muted max-md:hidden">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={`px-4 py-3 font-medium whitespace-nowrap ${c.numeric ? "text-right" : ""}`}>{c.header}</th>
              ))}
              {hasActions && <th className="px-4 py-3 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody className="max-md:block">
            {rows.map((row) => (
              <tr key={row._id} className="border-t border-line max-md:block max-md:px-4 max-md:py-3">
                {columns.map((c) => (
                  <td
                    key={c.header}
                    data-label={c.header}
                    className={`px-4 py-3 whitespace-nowrap ${c.numeric ? "text-right tabular-nums" : ""} max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1.5 max-md:whitespace-normal max-md:text-right max-md:before:text-left max-md:before:text-muted max-md:before:content-[attr(data-label)]`}
                  >{c.render(row)}</td>
                ))}
                {hasActions && (
                  <td className="flex items-center gap-2 px-4 py-3 max-md:flex-wrap max-md:px-0">
                    {rowActions?.(row)}
                    {onEdit && (
                      <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>Ubah</Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="danger" onClick={() => setToDelete(row)}>Hapus</Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toDelete && onDelete && (
        <Modal title="Hapus data?" onClose={() => setToDelete(null)}>
          <p className="mb-4 text-sm text-muted">Data yang dihapus tidak dapat dikembalikan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                onDelete(toDelete);
                setToDelete(null);
              }}
            >
              Ya, hapus
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
