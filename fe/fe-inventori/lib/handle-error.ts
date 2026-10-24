import { clearToken } from "@/lib/auth";
import { normalizeError, type AppError } from "@/lib/errors";

export type NotifyKind = "success" | "error" | "info";
export type Notify = (message: string, kind: NotifyKind) => void;

export function reportError(
  e: unknown,
  ctx: { notify: Notify; onSession: () => void },
): AppError {
  const err = normalizeError(e);
  if (err.kind === "session") {
    clearToken();
    ctx.onSession();
    ctx.notify(err.message, "error");
  } else if (err.kind !== "validation" || !err.fields) {
    ctx.notify(err.message, "error");
  }
  return err;
}
