"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import FilterChips from "@/components/FilterChips";
import LocationMap from "@/components/LocationMap";
import SessionExpired from "@/components/SessionExpired";
import { useAsync } from "@/hooks/useAsync";
import { EVENT_LABEL, listLocations, type LatestPosition } from "@/services/locations";

type Row = LatestPosition & { _id: string };

const when = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function LocationsPage() {
  const [days, setDays] = useState("7");
  const [focus, setFocus] = useState<string | null>(null);
  const { state, retry } = useAsync(() => listLocations(Number(days)), `loc-${days}`);

  if (state.status === "error" && state.error.kind === "session") return <SessionExpired />;
  const data = state.status === "ready" ? state.data : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Peta teknisi</h1>
          <p className="text-sm text-muted">
            Posisi diambil dari GPS HP teknisi saat pinjam, kembali, atau check-in.
            {data && ` Abu-abu = lebih dari ${data.staleHours} jam tidak update.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChips
            label="Rentang"
            options={[
              { value: "1", label: "Hari ini" },
              { value: "7", label: "7 hari" },
              { value: "30", label: "30 hari" },
            ]}
            value={days}
            onChange={(v) => { setDays(v); setFocus(null); }}
          />
          <Button variant="secondary" onClick={retry}>Muat ulang</Button>
        </div>
      </div>

      {data && <LocationMap latest={data.latest} history={data.history} focus={focus} />}

      <DataTable<Row>
        columns={[
          { header: "Teknisi", render: (r) => r.technicianName ?? "-" },
          { header: "Terakhir", render: (r) => `${when(r.at)} · ${EVENT_LABEL[r.event]}${r.serial ? ` ${r.serial}` : ""}` },
          { header: "Status", render: (r) => (r.stale ? <Badge tone="warn">Lama tidak update</Badge> : <Badge tone="ok">Aktif</Badge>) },
          {
            header: "Aksi",
            render: (r) => (
              <Button variant="secondary" onClick={() => setFocus(focus === r.technicianId ? null : r.technicianId)}>
                {focus === r.technicianId ? "Tampilkan semua" : "Lihat jejak"}
              </Button>
            ),
          },
        ]}
        rows={(data?.latest ?? []).map((r) => ({ ...r, _id: r.technicianId }))}
        emptyMessage="Belum ada lokasi terkirim pada rentang ini."
        status={state.status}
        errorMessage={state.status === "error" ? state.error.message : undefined}
        onRetry={retry}
      />
    </div>
  );
}
