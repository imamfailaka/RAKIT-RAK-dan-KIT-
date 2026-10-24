/** Alamat yang dibuka saat QR kategori dipindai. */
export const categoryScanPath = (categoryId: string): string => `/scan/c/${encodeURIComponent(categoryId)}`;
export const categoryScanUrl = (origin: string, categoryId: string): string => `${origin.replace(/\/$/, "")}${categoryScanPath(categoryId)}`;

/** Jalur halaman scan dari isi QR; null bila bukan QR kategori Rakit di situs ini. */
export function scanTargetPath(text: string, origin: string): string | null {
  try {
    const u = new URL(text);
    if (u.origin !== new URL(origin).origin || !/^\/scan\/c\/[^/]+$/.test(u.pathname)) return null;
    return u.pathname;
  } catch {
    return null;
  }
}
