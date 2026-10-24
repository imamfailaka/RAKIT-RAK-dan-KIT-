import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import SiteShell from "@/components/SiteShell";
import AdminNav from "@/components/AdminNav";
import { setToken, clearToken } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { makeJwt } from "./helpers";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  clearToken();
});

describe("identitas PT. Supra Primatama Nusantara", () => {
  it("menyimpan nama perusahaan di satu tempat", () => {
    expect(BRAND.company).toBe("PT. Supra Primatama Nusantara");
    expect(BRAND.app).toBe("Rakit");
  });
  it("halaman login menampilkan nama perusahaan", () => {
    render(<LoginPage />);
    expect(screen.getAllByText(BRAND.company).length).toBeGreaterThan(0);
  });
});

describe("kerangka halaman (sidebar)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test/api";
    setToken(makeJwt({ id: "u1", role: "admin", exp: Math.floor(Date.now() / 1000) + 3600 }));
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ meta: { status: 200, message: "ok" }, data: { _id: "u1", name: "IMAM", email: "i@x.id", role: "admin", isActive: true } }), {
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  it("menampilkan merek, nama perusahaan, dan isi halaman", () => {
    render(
      <SiteShell nav={<AdminNav />}>
        <p>isi</p>
      </SiteShell>,
    );
    expect(screen.getAllByText(BRAND.app).length).toBeGreaterThan(0);
    expect(screen.getAllByText(BRAND.company).length).toBeGreaterThan(0);
    expect(screen.getByText("isi")).toBeInTheDocument();
  });

  it("menampilkan nama dan peran pengguna di kartu pengguna, plus tombol Keluar", async () => {
    render(
      <SiteShell nav={<AdminNav />}>
        <p>isi</p>
      </SiteShell>,
    );
    await waitFor(() => expect(screen.getByText("IMAM")).toBeInTheDocument());
    expect(screen.getByText("Admin gudang")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Keluar" }).length).toBeGreaterThan(0);
  });

  it("tetap menampilkan peran bila nama gagal dimuat", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.reject(new Error("offline")));
    render(
      <SiteShell nav={<AdminNav />}>
        <p>isi</p>
      </SiteShell>,
    );
    expect(await screen.findByText("Admin gudang")).toBeInTheDocument();
  });
});
