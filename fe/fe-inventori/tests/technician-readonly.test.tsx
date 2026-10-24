import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TechNav from "@/components/TechNav";
import MyEquipmentPage from "@/app/my/equipment/page";

let pathname = "/my";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

afterEach(() => vi.restoreAllMocks());

function stubFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })),
  );
}

describe("TechNav", () => {
  it("links to loans, scan and equipment and never to admin pages", () => {
    pathname = "/my/equipment";
    render(<TechNav />);
    expect(screen.getByRole("link", { name: "Pinjaman saya" })).toHaveAttribute("href", "/my");
    expect(screen.getByRole("link", { name: "Alat" })).toHaveAttribute("href", "/my/equipment");
    expect(screen.getByRole("link", { name: "Sedang dipinjam" })).toHaveAttribute("href", "/my/borrowed");
    expect(screen.getByRole("link", { name: "Pindai alat" })).toHaveAttribute("href", "/my/scan");
    expect(screen.queryByRole("link", { name: /pengguna|kategori/i })).toBeNull();
  });
  it("highlights only the current page", () => {
    pathname = "/my";
    render(<TechNav />);
    expect(screen.getByRole("link", { name: "Pinjaman saya" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Alat" })).not.toHaveAttribute("aria-current");
  });
});

describe("technician read-only pages", () => {
  it("equipment page lists units and offers no add or edit action", async () => {
    stubFetch({
      meta: { status: 200, message: "ok" },
      data: [{ _id: "e1", serial: "OTDR-001", name: "OTDR", category: null, condition: "good", status: "available" }],
      pagination: { current: 1, total: 1, totalPages: 1 },
    });
    render(<MyEquipmentPage />);
    expect(await screen.findByText("OTDR-001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tambah|ubah|edit|hapus/i })).toBeNull();
  });
  it("shows an error message with retry when the API fails", async () => {
    stubFetch({ meta: { status: 500, message: "Server error" } }, 500);
    render(<MyEquipmentPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument());
  });
});
