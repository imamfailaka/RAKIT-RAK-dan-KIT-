"use client";

import Badge from "@/components/Badge";
import { useState } from "react";
import DataTable from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import SessionExpired from "@/components/SessionExpired";
import { useAsync } from "@/hooks/useAsync";
import { CONDITION_LABEL, dateOrDash, refName } from "@/lib/labels";
import { listMyLoans, type Loan } from "@/services/loans";

export default function MyHome() {
  const [loanPage, setLoanPage] = useState(1);
  const loans = useAsync(() => listMyLoans(loanPage), `l-${loanPage}`);

  if (loans.state.status === "error" && loans.state.error.kind === "session") return <SessionExpired />;
  const lData = loans.state.status === "ready" ? loans.state.data : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Pinjaman saya</h1>
        <DataTable<Loan>
          columns={[
            { header: "Alat", render: (r) => `${refName(r.equipment)}${r.equipment?.serial ? ` (${r.equipment.serial})` : ""}` },
            { header: "Dipinjam", render: (r) => dateOrDash(r.borrowedAt) },
            { header: "Status", render: (r) => (r.returnedAt ? `Dikembalikan ${dateOrDash(r.returnedAt)} (${CONDITION_LABEL[r.returnCondition ?? ""] ?? "-"})` : <Badge tone="info">Sedang dipinjam</Badge>) },
          ]}
          rows={lData?.data ?? []}
          status={loans.state.status}
          errorMessage={loans.state.status === "error" ? loans.state.error.message : undefined}
          onRetry={loans.retry}
        />
        {lData && <Pagination pagination={lData.pagination} onChange={setLoanPage} />}
      </section>
    </div>
  );
}
