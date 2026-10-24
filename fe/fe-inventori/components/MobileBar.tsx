"use client";

import Link from "next/link";
import Brand from "@/components/Brand";
import { useSession } from "@/components/useSession";

/** Bilah atas untuk layar sempit: merek dan keluar. Menu ada di bilah bawah. */
export default function MobileBar() {
  const { user, logout } = useSession();
  const link = "inline-flex min-h-11 items-center rounded-[14px] px-3 text-sm text-muted hover:text-ink";
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-2 md:hidden">
      <Brand compact />
      {user ? (
        <button onClick={logout} className={link}>Keluar</button>
      ) : (
        <Link href="/auth/login" className={link}>Masuk</Link>
      )}
    </header>
  );
}
