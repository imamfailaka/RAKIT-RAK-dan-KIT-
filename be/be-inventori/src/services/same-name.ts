import { escapeRegex } from "../utils/paginate";

/** Filter that finds a record with the same name ignoring letter case; `excludeId` leaves one record out (for edits). */
export function sameNameFilter(name: string, excludeId?: string): { name: RegExp; _id?: { $ne: string } } {
  const f: { name: RegExp; _id?: { $ne: string } } = { name: new RegExp(`^${escapeRegex(name.trim())}$`, "i") };
  if (excludeId) f._id = { $ne: excludeId };
  return f;
}
