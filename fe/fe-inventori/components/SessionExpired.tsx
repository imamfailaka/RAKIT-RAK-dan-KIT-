"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function SessionExpired() {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    clearToken();
    router.replace(`/auth/login?next=${encodeURIComponent(path)}`);
  }, [router, path]);
  return <p className="text-center text-muted">Sesi berakhir. Mengalihkan ke halaman login...</p>;
}
