"use client";

import QrLink from "@/components/QrLink";
import ResourceManager from "@/components/ResourceManager";
import type { Field } from "@/components/ResourceForm";
import { categoriesAdmin, type Category, type CategoryInput } from "@/services/categories";

const fields: Field[] = [{ name: "name", label: "Nama", type: "text", required: true }];

export default function CategoriesPage() {
  return (
    <ResourceManager<Category, CategoryInput>
      title="Kategori alat"
      columns={[{ header: "Nama", render: (r) => r.name }]}
      load={() => categoriesAdmin.list({ limit: 100 })}
      rowActions={(row) => <QrLink categoryId={row._id} name={row.name} />}
      fields={fields}
      toValues={(r) => ({ name: r.name })}
      toPayload={(v) => ({ name: String(v.name ?? "") })}
      create={(p) => categoriesAdmin.create(p)}
      update={(row, p) => categoriesAdmin.update(row._id, p)}
      remove={(row) => categoriesAdmin.remove(row._id)}
    />
  );
}
