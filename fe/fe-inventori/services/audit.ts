import { listPage, type Page } from "@/lib/crud";

export type AuditLog = {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetLabel: string;
  detail: string;
  ip: string;
  at: string;
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "auth.login": "Login berhasil",
  "auth.login_failed": "Login gagal",
  "auth.login_inactive": "Login ditolak (akun nonaktif)",
  "user.create": "Tambah pengguna",
  "user.update": "Ubah pengguna",
  "user.delete": "Hapus pengguna",
  "equipment.create": "Tambah alat",
  "equipment.update": "Ubah alat",
  "category.create": "Tambah kategori",
  "category.update": "Ubah kategori",
  "category.delete": "Hapus kategori",
  "loan.borrow": "Pinjam alat",
  "loan.return": "Kembalikan alat",
  "tracker.reset": "Ganti ID tracking",
};

export const AUDIT_GROUPS = [
  { value: "", label: "Semua" },
  { value: "auth", label: "Login" },
  { value: "loan", label: "Pinjam/kembali" },
  { value: "equipment", label: "Alat" },
  { value: "category", label: "Kategori" },
  { value: "user", label: "Pengguna" },
  { value: "tracker", label: "Tracking" },
];

export const ROLE_LABEL: Record<string, string> = { admin: "Admin", manager: "Manager", technician: "Teknisi" };

export function listAudit(page: number, search?: string, group?: string): Promise<Page<AuditLog>> {
  return listPage<AuditLog>("/audit", { page, limit: 20, search: search || undefined, group: group || undefined });
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(d) + " WIB";
}
