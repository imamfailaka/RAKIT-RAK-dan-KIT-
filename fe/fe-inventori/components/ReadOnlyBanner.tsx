"use client";

import { Eye } from "@phosphor-icons/react";
import { useRole } from "@/components/useSession";
import { isManager } from "@/lib/permissions";

/** Pengingat untuk akun manager bahwa semua halaman hanya untuk dilihat. */
export default function ReadOnlyBanner() {
  if (!isManager(useRole())) return null;
  return (
    <p role="note" className="mb-4 flex items-center gap-2 rounded-[14px] border border-info-ink/30 bg-info-bg px-3 py-2 text-sm text-info-ink">
      <Eye size={18} aria-hidden="true" /> Mode manager: Anda dapat melihat semua data, perubahan data dilakukan oleh admin.
    </p>
  );
}
