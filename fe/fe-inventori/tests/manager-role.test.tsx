import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { clearToken, decodeToken, setToken } from "@/lib/auth";
import { homeFor } from "@/lib/redirect";
import { makeJwt } from "./helpers";
import ResourceManager from "@/components/ResourceManager";
import AdminNav from "@/components/AdminNav";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import LoansPage from "@/app/admin/loans/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin" }));
afterEach(() => { vi.restoreAllMocks(); clearToken(); });

const future = Math.floor(Date.now() / 1000) + 3600;
const loginAs = (role: string) => setToken(makeJwt({ id: "u1", role, exp: future }));
const env = (data: unknown) => new Response(JSON.stringify({ meta: { status: 200, message: "m" }, data, pagination: { total: 1, current: 1, totalPages: 1 } }), { status: 200, headers: { "content-type": "application/json" } });

function Kategori() {
  return (
    <ResourceManager<{ _id: string; name: string }, { name: string }>
      title="Kategori"
      columns={[{ header: "Nama", render: (r) => r.name }]}
      load={async () => ({ data: [{ _id: "1", name: "OTDR" }], pagination: { total: 1, current: 1, totalPages: 1 } })}
      fields={[{ name: "name", label: "Nama", type: "text" }]}
      toValues={(r) => ({ name: r.name })}
      toPayload={(v) => ({ name: String(v.name) })}
      create={async () => {}}
      update={async () => {}}
      remove={async () => {}}
    />
  );
}

describe("akun manager", () => {
  it("token manager dikenali dan diarahkan ke area /admin", () => {
    expect(decodeToken(makeJwt({ id: "u1", role: "manager", exp: future }))?.role).toBe("manager");
    expect(homeFor("manager")).toBe("/admin");
  });
  it("manager hanya melihat: tombol Tambah/Ubah/Hapus disembunyikan, admin tetap punya", async () => {
    loginAs("manager");
    const { unmount } = render(<Kategori />);
    expect(await screen.findByText("OTDR")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tambah" })).toBeNull();
    expect(screen.queryByRole("button", { name: /ubah/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /hapus/i })).toBeNull();
    unmount();
    loginAs("admin");
    render(<Kategori />);
    expect(await screen.findByRole("button", { name: "Tambah" })).toBeInTheDocument();
  });
  it("halaman peminjaman: manager tidak bisa meminjamkan atau mencatat pengembalian", async () => {
    loginAs("manager");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(env([{ _id: "L1", equipment: { name: "OTDR", serial: "S1" }, technician: { name: "Budi" }, borrowedAt: "2026-11-10T00:00:00Z", returnedAt: null }]));
    await act(async () => { render(<LoansPage />); });
    expect(await screen.findByText("Budi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pinjamkan alat" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Kembalikan" })).toBeNull();
  });
  it("menu manager tanpa Kode QR, dengan Peta teknisi, dan banner mode manager", () => {
    loginAs("manager");
    render(<><AdminNav /><ReadOnlyBanner /></>);
    expect(screen.queryByRole("link", { name: /kode qr/i })).toBeNull();
    expect(screen.getAllByRole("link", { name: /peta teknisi/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("note")).toHaveTextContent(/mode manager/i);
  });
});
