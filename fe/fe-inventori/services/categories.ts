import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { makeCrud } from "@/lib/crud";

export type Category = { _id: string; name: string };
export type CategoryInput = { name: string };
export const categoriesAdmin = makeCrud<Category, CategoryInput>("/categories");

export async function listCategories(): Promise<Category[]> {
  const res = await apiFetch<Category[]>("/categories", { token: getToken(), query: { limit: 100 } });
  return res.data;
}
