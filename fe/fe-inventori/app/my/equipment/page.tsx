"use client";

import ResourceManager from "@/components/ResourceManager";
import { equipmentColumns } from "@/components/equipment-columns";
import { equipmentAdmin, type Equipment } from "@/services/equipment";

/** Read-only: no fields/create/update are passed, so no add or edit controls render. */
export default function MyEquipmentPage() {
  return <ResourceManager<Equipment, never> title="Daftar alat" columns={equipmentColumns} load={(page) => equipmentAdmin.list({ page, limit: 10 })} />;
}
