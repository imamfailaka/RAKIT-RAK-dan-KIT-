"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearToken, decodeToken, getToken, isExpired, subscribeAuth } from "@/lib/auth";

/** Pengguna dari token (peran saja); nama lengkap diambil terpisah lewat getMe. */
export function useSession() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeAuth, () => getToken() ?? "", () => "");
  const user = token && !isExpired(token) ? decodeToken(token) : null;
  return {
    token,
    user,
    logout() {
      clearToken();
      router.push("/auth/login");
    },
  };
}
