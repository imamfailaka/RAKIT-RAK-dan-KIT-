import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { BRAND } from "@/lib/brand";
import Brand from "@/components/Brand";

afterEach(() => {
  vi.doUnmock("@/lib/brand");
  vi.resetModules();
});

describe("Brand", () => {
  it("tautan ke beranda dengan logo dan tanpa ikon kunci pas", () => {
    const { container } = render(<Brand />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("[data-logo-mark]")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/phosphor/i);
  });

  it("menampilkan nama aplikasi dan perusahaan dari BRAND", () => {
    render(<Brand />);
    expect(screen.getByRole("link")).toHaveTextContent(BRAND.app);
    expect(screen.getByText(BRAND.company)).toBeInTheDocument();
  });

  it("pil RAK + KIT tersembunyi di HP dan tidak dibacakan pembaca layar", () => {
    render(<Brand />);
    const tags = screen.getByTestId("brand-tags");
    expect(tags).toHaveTextContent("RAK + KIT");
    expect(tags).toHaveAttribute("aria-hidden", "true");
    expect(tags).toHaveClass("max-sm:hidden");
  });

  it("nama aksesibel tautan tidak memuat RAK + KIT", () => {
    render(<Brand />);
    const link = screen.getByRole("link", { name: /Rakit/ });
    expect(link).toBeInTheDocument();
    expect(link).not.toHaveAccessibleName(/RAK\s*\+\s*KIT/);
    expect(link).toHaveAccessibleName(`${BRAND.app} ${BRAND.company}`);
  });

  it("mode compact menyembunyikan perusahaan di HP", () => {
    render(<Brand compact />);
    expect(screen.getByText(BRAND.company)).toHaveClass("max-sm:hidden");
  });

  it("nama sangat panjang terpotong dengan truncate", async () => {
    vi.resetModules();
    vi.doMock("@/lib/brand", () => ({
      BRAND: {
        company: "PT. Perusahaan Dengan Nama Yang Sangat Panjang Sekali Nusantara",
        app: "x".repeat(80),
        wordmark: { lead: "x".repeat(40), accent: "x".repeat(40) },
        tags: ["RAK", "KIT"],
      },
    }));
    const { default: BrandLong } = await import("@/components/Brand");
    const { container } = render(<BrandLong />);
    const truncated = container.querySelector(".truncate");
    expect(truncated).not.toBeNull();
    expect(truncated?.textContent).toContain("x".repeat(80));
  });
});
