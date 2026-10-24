"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAsync } from "@/hooks/useAsync";
import Button from "@/components/Button";
import DataTable, { type Column } from "@/components/DataTable";
import FilterChips, { type ChipOption } from "@/components/FilterChips";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import SearchBox from "@/components/SearchBox";
import ResourceForm, { type Field, type Values } from "@/components/ResourceForm";
import SessionExpired from "@/components/SessionExpired";
import { useToast } from "@/components/Toast";
import type { Page } from "@/lib/crud";
import { reportError } from "@/lib/handle-error";

type Row = { _id: string };
export type Query = { search: string; filter: string; filter2: string };

export default function ResourceManager<T extends Row, I>({
  title,
  columns,
  load,
  fields,
  toValues,
  toPayload,
  create,
  update,
  remove,
  rowActions,
  newValues,
  searchable,
  searchPlaceholder,
  filters,
  filterLabel,
  filters2,
  filter2Label,
}: {
  title: string;
  columns: Column<T>[];
  load: (page: number, q?: Query) => Promise<Page<T>>;
  fields?: Field[];
  toValues?: (row: T) => Values;
  toPayload?: (values: Values) => I;
  create?: (input: I) => Promise<unknown>;
  update?: (row: T, input: I) => Promise<unknown>;
  remove?: (row: T) => Promise<unknown>;
  rowActions?: (row: T, reload: () => void) => ReactNode;
  newValues?: Values;
  /** Tampilkan kotak cari; kata kunci dikirim ke load setelah jeda singkat. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Chip filter; pilihan pertama dianggap bawaan. */
  filters?: ChipOption[];
  filterLabel?: string;
  /** Baris chip kedua (misalnya kategori); pilihan pertama dianggap bawaan. */
  filters2?: ChipOption[];
  filter2Label?: string;
}) {
  const router = useRouter();
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(filters?.[0]?.value ?? "");
  const [filter2, setFilter2] = useState(filters2?.[0]?.value ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  const { state, retry } = useAsync(() => load(page, { search, filter, filter2 }), `${page}-${version}-${search}-${filter}-${filter2}`);
  const reload = () => setVersion((v) => v + 1);
  const ctx = { notify, onSession: () => router.replace("/auth/login") };

  if (state.status === "error" && state.error.kind === "session") return <SessionExpired />;

  async function save(values: Values) {
    if (!toPayload) return;
    setErrors({});
    try {
      const payload = toPayload(values);
      if (editing === "new") await create?.(payload);
      else if (editing) await update?.(editing, payload);
      notify("Data tersimpan.", "success");
      setEditing(null);
      reload();
    } catch (err) {
      const n = reportError(err, ctx);
      if (n.kind === "validation" && n.fields) setErrors(n.fields);
    }
  }

  async function del(row: T) {
    try {
      await remove?.(row);
      notify("Data dihapus.", "success");
      reload();
    } catch (err) {
      reportError(err, ctx);
    }
  }

  const ready = state.status === "ready";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {create && fields && <Button onClick={() => setEditing("new")}>Tambah</Button>}
      </div>
      {(searchable || filters || filters2) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {searchable && <SearchBox value={input} onChange={setInput} placeholder={searchPlaceholder} />}
          {filters && (
            <FilterChips
              options={filters}
              value={filter}
              label={filterLabel}
              onChange={(v) => {
                setFilter(v);
                setPage(1);
              }}
            />
          )}
          {filters2 && (
            <FilterChips
              options={filters2}
              value={filter2}
              label={filter2Label}
              onChange={(v) => {
                setFilter2(v);
                setPage(1);
              }}
            />
          )}
        </div>
      )}
      <DataTable
        emptyMessage={search || filter !== (filters?.[0]?.value ?? "") || filter2 !== (filters2?.[0]?.value ?? "") ? "Tidak ada data yang cocok." : undefined}
        columns={columns}
        rows={ready ? state.data.data : []}
        status={state.status}
        errorMessage={state.status === "error" ? state.error.message : undefined}
        onRetry={retry}
        onEdit={update && fields ? (row) => setEditing(row) : undefined}
        onDelete={remove ? del : undefined}
        rowActions={rowActions ? (row) => rowActions(row, reload) : undefined}
      />
      {ready && <Pagination pagination={state.data.pagination} onChange={setPage} />}
      {editing && fields && (
        <Modal title={editing === "new" ? `Tambah ${title}` : `Ubah ${title}`} onClose={() => setEditing(null)}>
          <ResourceForm
            key={editing === "new" ? "new" : editing._id}
            fields={fields}
            initial={editing === "new" ? (newValues ?? {}) : toValues?.(editing)}
            errors={errors}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
