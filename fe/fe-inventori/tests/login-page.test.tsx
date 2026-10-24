import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import { BRAND } from "@/lib/brand";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

describe("halaman login", () => {
  it("tidak menampilkan teks akun dibuat admin gudang", () => {
    render(<LoginPage />);
    expect(screen.queryByText(/dibuat oleh admin gudang/i)).toBeNull();
  });
  it("menampilkan judul, field email dan password, serta tombol Masuk", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });
  it("menampilkan nama aplikasi dari BRAND", () => {
    render(<LoginPage />);
    expect(screen.getAllByText(BRAND.app).length).toBeGreaterThan(0);
  });
  it("memasang panel showcase dan form lebih dulu dalam urutan DOM", () => {
    render(<LoginPage />);
    const showcase = screen.getByTestId("login-showcase");
    const form = screen.getByRole("button", { name: "Masuk" });
    expect(form.compareDocumentPosition(showcase) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("tidak lagi memakai ikon kunci pas pada halaman login", () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector("[data-logo-mark]")).not.toBeNull();
  });
});
