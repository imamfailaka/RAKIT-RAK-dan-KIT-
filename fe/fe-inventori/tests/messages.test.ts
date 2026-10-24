import { describe, it, expect } from "vitest";
import { translateMessage } from "@/lib/messages";

describe("translateMessage", () => {
  it.each([
    ["serial exists", "Serial sudah terdaftar."],
    ["email already used", "Email sudah dipakai akun lain."],
    ["category exists", "Nama kategori sudah ada."],
    ["equipment is already borrowed", "Alat ini sedang dipinjam."],
    ["equipment is not in good condition", "Alat tidak dalam kondisi baik, jadi tidak bisa dipinjamkan."],
    ["this loan has already been returned", "Pinjaman ini sudah dikembalikan."],
    ["technician not found or not active", "Teknisi tidak ditemukan atau tidak aktif."],
    ["category is still used by equipment", "Kategori masih dipakai alat, jadi tidak bisa dihapus."],
    ["you cannot demote or deactivate yourself", "Anda tidak bisa menurunkan peran atau menonaktifkan akun Anda sendiri."],
  ])("translates %s", (en, id) => {
    expect(translateMessage(en)).toBe(id);
  });
  it("translates the login lock message", () => {
    expect(translateMessage("too many login attempts")).toBe("Terlalu banyak percobaan login. Coba lagi nanti.");
  });
  it("returns unknown and already-Indonesian messages unchanged", () => {
    expect(translateMessage("Email atau password salah")).toBe("Email atau password salah");
    expect(translateMessage("something new")).toBe("something new");
  });
});
