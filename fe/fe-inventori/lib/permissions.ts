import type { Role } from "@/lib/auth";

/** Hanya admin yang boleh mengubah data; manager dan teknisi tidak. (Server tetap menjadi penjaga utama.) */
export const canEdit = (role: Role | undefined) => role === "admin";
export const isManager = (role: Role | undefined) => role === "manager";
