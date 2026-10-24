import type { Column } from "@/components/DataTable";
import Badge from "@/components/Badge";
import { conditionTone, equipmentStatusTone } from "@/lib/status";
import { CONDITION_LABEL, STATUS_LABEL, dateOrDash, refName } from "@/lib/labels";
import type { Equipment } from "@/services/equipment";

export const equipmentColumns: Column<Equipment>[] = [
  { header: "Serial", render: (r) => r.serial },
  { header: "Nama", render: (r) => r.name },
  { header: "Kategori", render: (r) => refName(r.category) },
  { header: "Lokasi", render: (r) => r.location || "-" },
  { header: "Status", render: (r) => <Badge tone={equipmentStatusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge> },
  { header: "Kondisi", render: (r) => <Badge tone={conditionTone(r.condition)}>{CONDITION_LABEL[r.condition] ?? r.condition}</Badge> },
  { header: "Kalibrasi berikutnya", render: (r) => dateOrDash(r.nextCalibration) },
];
