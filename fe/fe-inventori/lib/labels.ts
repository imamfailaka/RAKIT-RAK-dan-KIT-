export const CONDITION_LABEL: Record<string, string> = { good: "Baik", broken: "Rusak", repair: "Perbaikan" };
export const STATUS_LABEL: Record<string, string> = { available: "Tersedia", borrowed: "Dipinjam" };

type NamedRef = string | { _id?: string; name?: string } | null | undefined;

/** Category refs can be missing (deleted) or unpopulated; never show "undefined". */
export function refName(ref: NamedRef): string {
  if (!ref || typeof ref === "string") return "-";
  return ref.name || "-";
}

export function dateOrDash(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
}

/** For <input type="date">. */
export const toDateInput = (value: string | null | undefined): string =>
  value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString().slice(0, 10) : "";

export const numberOr = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
