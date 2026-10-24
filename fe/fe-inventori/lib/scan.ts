/** Alamat yang dibuka saat QR kategori dipindai. */
export const categoryScanPath = (categoryId: string): string => `/scan/c/${encodeURIComponent(categoryId)}`;
export const categoryScanUrl = (origin: string, categoryId: string): string => `${origin.replace(/\/$/, "")}${categoryScanPath(categoryId)}`;
