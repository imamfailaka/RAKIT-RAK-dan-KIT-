import { Response } from "express";
import * as Yup from "yup";

type Pagination = { totalPages: number; current: number; total: number };

const send = (res: Response, status: number, message: string, data: any = null, extra: object = {}) =>
  res.status(status).json({ meta: { status, message }, data, ...extra });

export default {
  success: (res: Response, data: any, message: string) => send(res, 200, message, data),
  created: (res: Response, data: any, message: string) => send(res, 201, message, data),
  pagination: (res: Response, data: any[], pagination: Pagination, message: string) =>
    send(res, 200, message, data, { pagination }),
  notFound: (res: Response, message = "not found") => send(res, 404, message),
  unauthorized: (res: Response, message = "unauthorized") => send(res, 403, message),
  conflict: (res: Response, message: string, data: any = null) => send(res, 409, message, data),
  tooMany: (res: Response, message: string, data: any = null) => send(res, 429, message, data),
  badRequest: (res: Response, message: string, data: any = null) => send(res, 400, message, data),
  /** Maps validation errors to 400 with one message per field; anything else is a generic 500. */
  error(res: Response, error: unknown, message: string) {
    if (error instanceof Yup.ValidationError) {
      const fields: Record<string, string> = {};
      for (const inner of error.inner.length ? error.inner : [error]) {
        const key = inner.path || "_";
        if (!fields[key]) fields[key] = inner.message;
      }
      return send(res, 400, message, fields);
    }
    console.error(message, error);
    return send(res, 500, message, null);
  },
};
