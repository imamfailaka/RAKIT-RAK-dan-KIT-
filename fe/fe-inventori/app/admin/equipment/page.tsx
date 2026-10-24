"use client";

import ResourceManager from "@/components/ResourceManager";
import type { Field } from "@/components/ResourceForm";
import SessionExpired from "@/components/SessionExpired";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";
import { equipmentColumns } from "@/components/equipment-columns";
import { useAsync } from "@/hooks/useAsync";
import { toDateInput } from "@/lib/labels";
import { equipmentAdmin, type Condition, type Equipment, type EquipmentInput } from "@/services/equipment";
import { listCategories } from "@/services/categories";

const conditions = [
  { value: "good", label: "Baik" },
  { value: "broken", label: "Rusak" },
  { value: "repair", label: "Perbaikan" },
];

export default function EquipmentPage() {
  const { state, retry } = useAsync(() => listCategories(), "cats");
  if (state.status === "loading") return <Skeleton count={3} />;
  if (state.status === "error") {
    return state.error.kind === "session" ? <SessionExpired /> : <ErrorState message={state.error.message} onRetry={retry} />;
  }

  const fields: Field[] = [
    { name: "serial", label: "Serial", type: "text", required: true },
    { name: "name", label: "Nama", type: "text", required: true },
    { name: "category", label: "Kategori", type: "select", required: true, options: state.data.map((c) => ({ value: c._id, label: c.name })) },
    { name: "location", label: "Lokasi", type: "text" },
    { name: "condition", label: "Kondisi", type: "select", required: true, options: conditions },
    { name: "lastCalibration", label: "Kalibrasi terakhir", type: "date" },
    { name: "nextCalibration", label: "Kalibrasi berikutnya", type: "date" },
  ];

  return (
    <div className="flex flex-col gap-3">
    <ResourceManager<Equipment, EquipmentInput>
      title="Alat"
      columns={equipmentColumns}
      load={(page, q) => equipmentAdmin.list({ page, limit: 10, search: q?.search, status: q?.filter || undefined, category: q?.filter2 || undefined })}
      searchable
      searchPlaceholder="Cari nama atau serial alat"
      filterLabel="Status alat"
      filters={[
        { value: "", label: "Semua" },
        { value: "available", label: "Tersedia" },
        { value: "borrowed", label: "Dipinjam" },
      ]}
      filters2={[{ value: "", label: "Semua kategori" }, ...state.data.map((c) => ({ value: c._id, label: c.name }))]}
      filter2Label="Kategori alat"
      fields={fields}
      newValues={{ condition: "good" }}
      toValues={(r) => ({
        serial: r.serial,
        name: r.name,
        category: typeof r.category === "object" && r.category ? r.category._id : (r.category ?? ""),
        location: r.location ?? "",
        condition: r.condition,
        lastCalibration: toDateInput(r.lastCalibration),
        nextCalibration: toDateInput(r.nextCalibration),
      })}
      toPayload={(v) => ({
        serial: String(v.serial ?? ""),
        name: String(v.name ?? ""),
        category: String(v.category ?? ""),
        location: String(v.location ?? ""),
        condition: (String(v.condition ?? "good") as Condition),
        lastCalibration: v.lastCalibration ? String(v.lastCalibration) : undefined,
        nextCalibration: v.nextCalibration ? String(v.nextCalibration) : undefined,
      })}
      create={(p) => equipmentAdmin.create(p)}
      update={(row, p) => equipmentAdmin.update(row._id, p)}
    />
    </div>
  );
}
