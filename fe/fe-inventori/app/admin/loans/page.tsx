"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import BorrowForm from "@/components/BorrowForm";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import FilterChips from "@/components/FilterChips";
import ErrorState from "@/components/ErrorState";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import ReturnDialog from "@/components/ReturnDialog";
import SessionExpired from "@/components/SessionExpired";
import Skeleton from "@/components/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { CONDITION_LABEL, dateOrDash, refName } from "@/lib/labels";
import { listAvailableEquipment } from "@/services/equipment";
import { borrowEquipment, listLoans, returnLoan, type Loan } from "@/services/loans";
import { listTechnicians } from "@/services/users";

function BorrowModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { state, retry } = useAsync(async () => ({ equipment: await listAvailableEquipment(), technicians: await listTechnicians() }), "borrow-options");
  return (
    <Modal title="Pinjamkan alat" onClose={onClose}>
      {state.status === "loading" && <Skeleton count={2} />}
      {state.status === "error" && <ErrorState message={state.error.message} onRetry={retry} />}
      {state.status === "ready" && (
        <BorrowForm equipment={state.data.equipment} technicians={state.data.technicians} submit={borrowEquipment} onDone={() => { onClose(); onDone(); }} />
      )}
    </Modal>
  );
}

export default function LoansPage() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState("open");
  const onlyOpen = view === "open";
  const [version, setVersion] = useState(0);
  const [borrowing, setBorrowing] = useState(false);
  const [returning, setReturning] = useState<Loan | null>(null);
  const { state, retry } = useAsync(() => listLoans(page, onlyOpen), `${page}-${onlyOpen}-${version}`);
  const reload = () => setVersion((v) => v + 1);

  if (state.status === "error" && state.error.kind === "session") return <SessionExpired />;
  const ready = state.status === "ready";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Peminjaman</h1>
        <Button onClick={() => setBorrowing(true)}>Pinjamkan alat</Button>
      </div>
      <FilterChips
        label="Tampilan pinjaman"
        value={view}
        onChange={(v) => { setView(v); setPage(1); }}
        options={[
          { value: "open", label: "Belum dikembalikan" },
          { value: "all", label: "Semua" },
        ]}
      />
      <DataTable<Loan>
        columns={[
          { header: "Alat", render: (r) => `${refName(r.equipment)}${r.equipment?.serial ? ` (${r.equipment.serial})` : ""}` },
          { header: "Teknisi", render: (r) => refName(r.technician) },
          { header: "Dipinjam", render: (r) => dateOrDash(r.borrowedAt) },
          { header: "Dikembalikan", render: (r) => (r.returnedAt ? `${dateOrDash(r.returnedAt)} (${CONDITION_LABEL[r.returnCondition ?? ""] ?? "-"})` : <Badge tone="warn">Belum</Badge>) },
        ]}
        rows={ready ? state.data.data : []}
        status={state.status}
        errorMessage={state.status === "error" ? state.error.message : undefined}
        onRetry={retry}
        rowActions={(r) => (r.returnedAt ? null : <Button size="sm" variant="secondary" onClick={() => setReturning(r)}>Kembalikan</Button>)}
      />
      {ready && <Pagination pagination={state.data.pagination} onChange={setPage} />}
      {borrowing && <BorrowModal onClose={() => setBorrowing(false)} onDone={reload} />}
      {returning && (
        <Modal title="Catat pengembalian" onClose={() => setReturning(null)}>
          <ReturnDialog loan={returning} submit={returnLoan} onDone={() => { setReturning(null); reload(); }} />
        </Modal>
      )}
    </div>
  );
}
