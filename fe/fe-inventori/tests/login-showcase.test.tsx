import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import LoginShowcase from "@/components/LoginShowcase";

describe("LoginShowcase", () => {
  it("punya judul tingkat 2", () => {
    render(<LoginShowcase />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Semua peralatan teknisi, terlacak per unit." }),
    ).toBeInTheDocument();
  });

  it("menampilkan tiga butir sorotan", () => {
    render(<LoginShowcase />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Alat dilacak per nomor seri");
    expect(items[1]).toHaveTextContent("Scan QR kategori, pinjam dan kembali tercatat");
    expect(items[2]).toHaveTextContent("Kalibrasi dan pinjaman terlambat diingatkan");
  });

  it("menampilkan wordmark dan nama perusahaan dari BRAND", () => {
    render(<LoginShowcase />);
    const showcase = screen.getByTestId("login-showcase");
    expect(within(showcase).getByText(BRAND.company)).toBeInTheDocument();
    expect(showcase).toHaveTextContent(BRAND.app);
    expect(showcase.querySelector("[data-logo-mark]")).not.toBeNull();
  });

  it("setiap elemen beranimasi mematuhi prefers-reduced-motion", () => {
    const { container } = render(<LoginShowcase />);
    const animated = container.querySelectorAll(".animate-rise");
    expect(animated.length).toBeGreaterThanOrEqual(4);
    animated.forEach((el) => expect(el).toHaveClass("motion-reduce:animate-none"));
  });
});
