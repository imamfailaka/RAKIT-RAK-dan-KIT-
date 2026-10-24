import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryScanView from "@/components/CategoryScanView";
import { categoryScanPath, categoryScanUrl } from "@/lib/scan";

const router = { replace: vi.fn(), push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => vi.restoreAllMocks());

const item = (over = {}) => ({ id: "E1", serial: "W33J24122969", name: "Fusion Splicer SIGNAL FIRE AI8", status: "available", condition: "good", mine: false, action: "borrow", ...over });
const env = (data: unknown, status = 200) => new Response(JSON.stringify({ meta: { status, message: "m" }, data }), { status, headers: { "content-type": "application/json" } });
const scan = (items: unknown[]) => env({ category: { id: "C1", name: "Mesin Fusion Splicer" }, items });

function stub(routes: Record<string, () => Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((url, init) => {
    const key = `${(init as RequestInit | undefined)?.method ?? "GET"} ${String(url).replace(/^.*\/scan/, "/scan")}`;
    return Promise.resolve(routes[key]?.() ?? env(null, 500));
  });
}
const page = () => act(async () => { render(<CategoryScanView id="C1" />); });

describe("QR kategori", () => {
  it("membangun alamat yang bisa dibaca balik", () => {
    expect(categoryScanPath("C 1")).toBe("/scan/c/C%201");
    expect(categoryScanUrl("https://rakit.test/", "C1")).toBe("https://rakit.test/scan/c/C1");
  });
});

describe("halaman scan kategori", () => {
  it("membuka halaman tidak mengubah data; hanya GET", async () => {
    const f = stub({ "GET /scan/category/C1": () => scan([item()]) });
    await page();
    expect(await screen.findByRole("button", { name: "Pinjam" })).toBeInTheDocument();
    expect(f.mock.calls.every(([, i]) => ((i as RequestInit)?.method ?? "GET") === "GET")).toBe(true);
  });
  it("unit yang dipinjam orang lain terkunci dan tidak bisa diklik", async () => {
    stub({ "GET /scan/category/C1": () => scan([item({ status: "borrowed", action: "locked", borrower: "Budi", borrowedAt: "2026-10-20T00:00:00Z" })]) });
    await page();
    const btn = await screen.findByRole("button", { name: /sedang dipinjam/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/oleh Budi/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kembalikan/i })).toBeNull();
  });
  it("unit rusak tidak bisa dipinjam", async () => {
    stub({ "GET /scan/category/C1": () => scan([item({ condition: "broken", action: "locked" })]) });
    await page();
    expect(await screen.findByRole("button", { name: /tidak bisa dipinjam/i })).toBeDisabled();
  });
  it("meminjam lewat klik, lalu memuat ulang daftar", async () => {
    let borrowed = false;
    const f = stub({
      "GET /scan/category/C1": () => scan([item(borrowed ? { status: "borrowed", action: "return", mine: true, borrowedAt: "2026-10-24T00:00:00Z" } : {})]),
      "POST /scan/W33J24122969/borrow": () => { borrowed = true; return env({ id: "L1" }, 201); },
    });
    await page();
    await userEvent.click(await screen.findByRole("button", { name: "Pinjam" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/berhasil dipinjam/i);
    expect(await screen.findByRole("button", { name: "Kembalikan" })).toBeInTheDocument();
    expect(f.mock.calls.filter(([, i]) => (i as RequestInit)?.method === "POST")).toHaveLength(1);
  });
  it("peminjam memilih kondisi lalu mengembalikan", async () => {
    const f = stub({
      "GET /scan/category/C1": () => scan([item({ status: "borrowed", action: "return", mine: true, borrowedAt: "2026-10-24T00:00:00Z" })]),
      "POST /scan/W33J24122969/return": () => env({ id: "L1" }),
    });
    await page();
    await userEvent.click(await screen.findByRole("button", { name: "Kembalikan" }));
    await userEvent.selectOptions(screen.getByLabelText(/kondisi saat dikembalikan/i), "repair");
    await userEvent.click(screen.getByRole("button", { name: /konfirmasi kembalikan/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/dikembalikan/i));
    const post = f.mock.calls.find(([, i]) => (i as RequestInit)?.method === "POST")!;
    expect(JSON.parse((post[1] as RequestInit).body as string)).toMatchObject({ returnCondition: "repair" });
  });
  it("kalah balapan: menampilkan pesan konflik dan memuat ulang", async () => {
    stub({
      "GET /scan/category/C1": () => scan([item()]),
      "POST /scan/W33J24122969/borrow": () => env(null, 409),
    });
    await page();
    await userEvent.click(await screen.findByRole("button", { name: "Pinjam" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
  it("admin hanya melihat", async () => {
    stub({ "GET /scan/category/C1": () => scan([item({ action: "view" })]) });
    await page();
    expect(await screen.findByText(/admin hanya melihat/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pinjam/i })).toBeNull();
  });
});

import { scanTargetPath } from "@/lib/scan";
describe("membaca isi QR", () => {
  it("menerima alamat QR kategori di situs yang sama", () => {
    expect(scanTargetPath("https://rakit.test/scan/c/C1", "https://rakit.test")).toBe("/scan/c/C1");
  });
  it("menolak situs lain dan teks bebas", () => {
    expect(scanTargetPath("https://jahat.test/scan/c/C1", "https://rakit.test")).toBeNull();
    expect(scanTargetPath("halo", "https://rakit.test")).toBeNull();
    expect(scanTargetPath("https://rakit.test/admin", "https://rakit.test")).toBeNull();
  });
});
