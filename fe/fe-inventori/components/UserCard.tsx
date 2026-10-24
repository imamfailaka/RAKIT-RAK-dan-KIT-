"use client";

import { SignOut } from "@phosphor-icons/react";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/components/useSession";
import { getMe } from "@/services/auth";

const ROLE_LABEL = { admin: "Admin gudang", technician: "Teknisi" } as const;

/** Kartu pengguna di dasar sidebar: nama, peran, dan tombol keluar. Nama gagal dimuat → peran tetap tampil. */
export default function UserCard() {
  const { token, user, logout } = useSession();
  const { state } = useAsync(() => (token ? getMe(token) : Promise.reject(new Error("no token"))), token);
  if (!user) return null;
  const name = state.status === "ready" ? state.data.name : null;
  return (
    <div className="flex items-center gap-3 border-t border-line p-3">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-alt text-sm font-semibold text-ink">
        {(name ?? ROLE_LABEL[user.role]).charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        {name && <span className="truncate text-sm font-medium text-ink">{name}</span>}
        <span className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</span>
      </div>
      <button
        onClick={logout}
        aria-label="Keluar"
        title="Keluar"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] text-muted hover:bg-surface-alt hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <SignOut size={20} aria-hidden />
      </button>
    </div>
  );
}
