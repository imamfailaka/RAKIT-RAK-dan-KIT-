import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Pagination } from "@/types/api";

export type ListParams = { page?: number; limit?: number; search?: string; status?: string; category?: string; role?: string };
export type Page<T> = { data: T[]; pagination: Pagination };

export function makeCrud<T, I>(base: string) {
  const one = (id: string) => `${base}/${encodeURIComponent(id)}`;
  return {
    async list(p: ListParams = {}): Promise<Page<T>> {
      const res = await apiFetch<T[]>(base, { token: getToken(), query: { ...p, search: p.search || undefined } });
      return {
        data: res.data,
        pagination: res.pagination ?? { current: 1, total: res.data.length, totalPages: 1 },
      };
    },
    async create(input: I): Promise<T> {
      const res = await apiFetch<T>(base, { method: "POST", token: getToken(), body: JSON.stringify(input) });
      return res.data;
    },
    async update(id: string, input: Partial<I>): Promise<T> {
      const res = await apiFetch<T>(one(id), { method: "PUT", token: getToken(), body: JSON.stringify(input) });
      return res.data;
    },
    async remove(id: string): Promise<void> {
      await apiFetch<unknown>(one(id), { method: "DELETE", token: getToken() });
    },
  };
}

/** Paged GET on any list endpoint; falls back to a single page when the API sends no pagination. */
export async function listPage<T>(path: string, query: Record<string, string | number | boolean | undefined> = {}): Promise<Page<T>> {
  const res = await apiFetch<T[]>(path, { token: getToken(), query });
  return { data: res.data, pagination: res.pagination ?? { current: 1, total: res.data.length, totalPages: 1 } };
}
