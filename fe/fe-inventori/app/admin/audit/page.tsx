"use client";

import Badge from "@/components/Badge";
import ResourceManager from "@/components/ResourceManager";
import type { Tone } from "@/lib/status";
import { AUDIT_ACTION_LABEL, AUDIT_GROUPS, ROLE_LABEL, formatDateTime, listAudit, type AuditLog } from "@/services/audit";

const tone = (action: string): Tone =>
  action === "auth.login_failed" || action === "auth.login_inactive" || action.endsWith(".delete") ? "danger" : action.startsWith("auth.") ? "neutral" : "info";

/** Catatan audit: siapa melakukan apa dan kapan. Hanya bisa dilihat (admin dan manager), tidak bisa diubah. */
export default function AuditPage() {
  return (
    <div className="flex flex-col gap-2">
      <ResourceManager<AuditLog, never>
        title="Audit"
        columns={[
          { header: "Waktu", render: (r) => formatDateTime(r.at) },
          {
            header: "Pengguna",
            render: (r) => (r.actorName ? `${r.actorName}${r.actorRole ? ` (${ROLE_LABEL[r.actorRole] ?? r.actorRole})` : ""}` : "Tidak dikenal"),
          },
          { header: "Aksi", render: (r) => <Badge tone={tone(r.action)}>{AUDIT_ACTION_LABEL[r.action] ?? r.action}</Badge> },
          { header: "Objek", render: (r) => r.targetLabel || "-" },
          { header: "Detail", render: (r) => r.detail || "-" },
        ]}
        load={(page, q) => listAudit(page, q?.search, q?.filter)}
        searchable
        searchPlaceholder="Cari nama, alat, atau detail"
        filterLabel="Jenis aktivitas"
        filters={AUDIT_GROUPS}
      />
      <p className="text-xs text-muted">Catatan disimpan 1 tahun dan tidak dapat diubah atau dihapus.</p>
    </div>
  );
}
