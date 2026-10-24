const MESSAGES: Record<string, string> = {
  "serial exists": "Serial sudah terdaftar.",
  "email already used": "Email sudah dipakai akun lain.",
  "category exists": "Nama kategori sudah ada.",
  "category is still used by equipment": "Kategori masih dipakai alat, jadi tidak bisa dihapus.",
  "this loan belongs to another technician": "Pinjaman ini milik teknisi lain.",
  "there is no active loan for this equipment": "Alat ini tidak sedang dipinjam.",
  "equipment is already borrowed": "Alat ini sedang dipinjam.",
  "equipment is not in good condition": "Alat tidak dalam kondisi baik, jadi tidak bisa dipinjamkan.",
  "this loan has already been returned": "Pinjaman ini sudah dikembalikan.",
  "technician not found or not active": "Teknisi tidak ditemukan atau tidak aktif.",
  "you cannot demote or deactivate yourself": "Anda tidak bisa menurunkan peran atau menonaktifkan akun Anda sendiri.",
  "account is not active": "Akun tidak aktif.",
  "too many login attempts": "Terlalu banyak percobaan login. Coba lagi nanti.",
};

/** Backend messages are English; people using the app read Indonesian. Unknown text passes through. */
export function translateMessage(message: string): string {
  return MESSAGES[message] ?? message;
}
