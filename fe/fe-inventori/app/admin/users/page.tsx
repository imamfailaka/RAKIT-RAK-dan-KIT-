"use client";

import Badge from "@/components/Badge";
import ResourceManager from "@/components/ResourceManager";
import type { Field } from "@/components/ResourceForm";
import { userPayload, usersAdmin, type AppUser, type UserInput } from "@/services/users";

const fields: Field[] = [
  { name: "name", label: "Nama", type: "text", required: true },
  { name: "email", label: "Email (untuk login)", type: "text", required: true },
  { name: "password", label: "Password (kosongkan bila tidak diubah)", type: "password" },
  {
    name: "role",
    label: "Peran",
    type: "select",
    required: true,
    options: [
      { value: "technician", label: "Teknisi" },
      { value: "manager", label: "Manager (lihat saja)" },
      { value: "admin", label: "Admin" },
    ],
  },
  { name: "isActive", label: "Akun aktif", type: "checkbox" },
];

const ROLE_LABEL: Record<string, string> = { admin: "Admin", manager: "Manager", technician: "Teknisi" };

export default function UsersPage() {
  return (
    <ResourceManager<AppUser, UserInput>
      title="Pengguna"
      columns={[
        { header: "Nama", render: (r) => r.name },
        { header: "Email", render: (r) => r.email },
        { header: "Peran", render: (r) => ROLE_LABEL[r.role] ?? r.role },
        { header: "Status", render: (r) => <Badge tone={r.isActive ? "ok" : "neutral"}>{r.isActive ? "Aktif" : "Nonaktif"}</Badge> },
      ]}
      load={(page, q) => usersAdmin.list({ page, limit: 10, search: q?.search, role: q?.filter || undefined })}
      searchable
      searchPlaceholder="Cari nama atau email"
      filterLabel="Peran"
      filters={[
        { value: "", label: "Semua" },
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "technician", label: "Teknisi" },
      ]}
      fields={fields}
      newValues={{ role: "technician", isActive: true }}
      toValues={(r) => ({ name: r.name, email: r.email, password: "", role: r.role, isActive: r.isActive })}
      toPayload={userPayload}
      create={(p) => usersAdmin.create(p)}
      update={(row, p) => usersAdmin.update(row._id, p)}
      remove={(row) => usersAdmin.remove(row._id)}
    />
  );
}
