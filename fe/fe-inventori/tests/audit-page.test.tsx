import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AuditPage from "@/app/admin/audit/page";
import AdminNav from "@/components/AdminNav";
import { clearToken, setToken } from "@/lib/auth";
import { formatDateTime } from "@/services/audit";
import { makeJwt } from "./helpers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin/audit" }));
afterEach(() => { vi.restoreAllMocks(); clearToken(); });

const future = Math.floor(Date.now() / 1000) + 3600;
const row = {
  _id: "a1", actorName: "Tabrie", actorRole: "technician", action: "loan.borrow", targetType: "equipment",
  targetLabel: "OTDR AE2300 (AE2300-01)", detail: "scan QR", ip: "1.2.3.4", at: "2026-11-15T10:35:00Z",
};

describe("halaman audit", () => {
  it("menampilkan siapa, aksi, objek, dan detail; tanpa tombol ubah/hapus", async () => {
    setToken(makeJwt({ id: "u1", role: "manager", exp: future }));
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ meta: { status: 200, message: "ok" }, data: [row], pagination: { total: 1, current: 1, totalPages: 1 } }), { status: 200 }),
    );
    await act(async () => { render(<AuditPage />); });
    expect((await screen.findAllByText("Tabrie (Teknisi)")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pinjam alat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OTDR AE2300 (AE2300-01)").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /tambah|ubah|hapus/i })).toBeNull();
    expect(String(f.mock.calls[0][0])).toContain("/audit");
  });
  it("menu Audit muncul untuk admin dan manager", () => {
    setToken(makeJwt({ id: "u1", role: "manager", exp: future }));
    render(<AdminNav />);
    expect(screen.getAllByRole("link", { name: /audit/i }).length).toBeGreaterThan(0);
  });
  it("waktu ditampilkan dalam WIB", () => {
    expect(formatDateTime("2026-11-15T10:35:00Z")).toMatch(/17[.:]35.*WIB/);
  });
});
