import type { ApiEnvelope } from "@/types/api";
import { ApiError } from "@/lib/errors";

type Query = Record<string, string | number | boolean | undefined>;

export type ApiInit = RequestInit & { token?: string; query?: Query };

function buildUrl(path: string, query?: Query): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return `${base}${path}${qs ? `?${qs}` : ""}`;
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<ApiEnvelope<T>> {
  const { token, query, headers, ...rest } = init;
  const isForm = typeof FormData !== "undefined" && rest.body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(buildUrl(path, query), { ...rest, headers: finalHeaders });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  const status = body?.meta?.status ?? res.status;
  if (!res.ok || status >= 400 || body === null) {
    throw new ApiError(status, body?.data ?? null, body?.meta?.message);
  }
  return body;
}
