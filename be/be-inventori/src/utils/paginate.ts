import { Request } from "express";

export function pageParams(req: Request) {
  const q = req.query as any;
  const limit = Math.min(Math.max(Math.floor(+q.limit) || 10, 1), 100);
  const page = Math.max(Math.floor(+q.page) || 1, 1);
  return { limit, page, skip: (page - 1) * limit };
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
