export type Pagination = { current: number; total: number; totalPages: number };

export type ApiEnvelope<T> = {
  meta: { status: number; message: string };
  data: T;
  pagination?: Pagination;
};
