import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminNav from "@/components/AdminNav";

let path = "/admin/loans";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

describe("AdminNav (rel ikon)", () => {
  it("menampilkan lima menu admin dengan nama yang bisa dibaca pembaca layar", () => {
    render(<AdminNav />);
    for (const name of ["Dashboard", "Alat", "Peminjaman", "Kategori", "Pengguna"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
  it("menampilkan tulisan menu di samping ikon, bukan hanya ikon", () => {
    render(<AdminNav />);
    for (const name of ["Dashboard", "Alat", "Peminjaman", "Kategori", "Pengguna"]) {
      expect(screen.getByRole("link", { name })).toHaveTextContent(name);
    }
  });
  it("mengelompokkan menu admin dengan judul grup", () => {
    render(<AdminNav />);
    for (const g of ["Ringkasan", "Aset", "Aktivitas", "Administrasi"]) {
      expect(screen.getByText(g)).toBeInTheDocument();
    }
  });
  it("menandai hanya halaman aktif dengan aria-current", () => {
    path = "/admin/loans";
    render(<AdminNav />);
    expect(screen.getByRole("link", { name: "Peminjaman" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
  it("Dashboard hanya aktif di /admin persis", () => {
    path = "/admin";
    render(<AdminNav />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Alat" })).not.toHaveAttribute("aria-current");
  });
});
