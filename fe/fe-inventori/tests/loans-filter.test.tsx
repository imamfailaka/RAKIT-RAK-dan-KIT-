import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoansPage from "@/app/admin/loans/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

afterEach(() => vi.restoreAllMocks());

function stub() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify({ meta: { status: 200, message: "ok" }, data: [], pagination: { current: 1, total: 0, totalPages: 1 } }), {
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

describe("halaman Peminjaman: filter chip", () => {
  it("menampilkan chip Belum dikembalikan (aktif) dan Semua", async () => {
    stub();
    render(<LoansPage />);
    expect(await screen.findByRole("button", { name: "Belum dikembalikan" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Semua" })).toHaveAttribute("aria-pressed", "false");
  });
  it("memilih Semua menghapus filter open pada permintaan", async () => {
    const spy = stub();
    render(<LoansPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Semua" }));
    await waitFor(() => {
      const urls = spy.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.includes("/loans?") && !u.includes("open=true"))).toBe(true);
    });
  });
});
