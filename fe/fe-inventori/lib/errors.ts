import { translateMessage } from "@/lib/messages";

export type AppErrorKind = "validation" | "session" | "notfound" | "conflict" | "server" | "network";

export type AppError = {
  kind: AppErrorKind;
  message: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const TOKEN_ERROR = /jwt|token|expired/i;

export function normalizeError(e: unknown): AppError {
  if (e instanceof ApiError) {
    if (e.status === 403) return { kind: "session", message: "Sesi berakhir, silakan login lagi." };
    if (e.status === 404) return { kind: "notfound", message: "Data tidak ditemukan." };
    if (e.status === 409) return { kind: "conflict", message: translateMessage(e.message) };
    if (e.status === 400 || e.status === 429) {
      const fields =
        e.data && typeof e.data === "object" ? (e.data as Record<string, string>) : undefined;
      return { kind: "validation", message: translateMessage(e.message), fields };
    }
    if (TOKEN_ERROR.test(e.message)) {
      return { kind: "session", message: "Sesi berakhir, silakan login lagi." };
    }
    return { kind: "server", message: "Terjadi kesalahan pada server. Coba lagi." };
  }
  return { kind: "network", message: "Tidak dapat terhubung ke server. Periksa koneksi Anda." };
}
