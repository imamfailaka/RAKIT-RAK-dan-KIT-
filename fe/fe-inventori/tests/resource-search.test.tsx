import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResourceManager from "@/components/ResourceManager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

type Row = { _id: string; name: string };
const columns = [{ header: "Nama", render: (r: Row) => r.name }];
const pageOf = (rows: Row[]) => Promise.resolve({ data: rows, pagination: { current: 1, total: rows.length, totalPages: 1 } });

describe("ResourceManager: pencarian dan filter", () => {
  it("tidak menampilkan kotak cari bila searchable tidak diaktifkan", async () => {
    const load = vi.fn(() => pageOf([{ _id: "1", name: "Kabel" }]));
    render(<ResourceManager<Row, never> title="Daftar" columns={columns} load={load} />);
    await screen.findByText("Kabel");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("mengirim kata kunci ke load dan kembali ke halaman 1", async () => {
    const load = vi.fn(() => pageOf([{ _id: "1", name: "OTDR" }]));
    render(<ResourceManager<Row, never> title="Alat" columns={columns} load={load} searchable />);
    await screen.findByText("OTDR");
    await userEvent.type(screen.getByRole("searchbox", { name: /cari/i }), "SN-42");
    await waitFor(() => expect(load).toHaveBeenLastCalledWith(1, { search: "SN-42", filter: "", filter2: "" }));
  });

  it("memanggil load dengan nilai chip yang dipilih dan menandainya aktif", async () => {
    const load = vi.fn(() => pageOf([{ _id: "1", name: "OTDR" }]));
    const filters = [
      { value: "", label: "Semua" },
      { value: "available", label: "Tersedia" },
    ];
    render(<ResourceManager<Row, never> title="Alat" columns={columns} load={load} filters={filters} />);
    await screen.findByText("OTDR");
    expect(screen.getByRole("button", { name: "Semua" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Tersedia" }));
    await waitFor(() => expect(load).toHaveBeenLastCalledWith(1, { search: "", filter: "available", filter2: "" }));
    expect(screen.getByRole("button", { name: "Tersedia" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Semua" })).toHaveAttribute("aria-pressed", "false");
  });

  it("menjelaskan bahwa tidak ada hasil saat pencarian kosong", async () => {
    const load = vi.fn((_p: number, q?: { search: string }) => pageOf(q?.search ? [] : [{ _id: "1", name: "OTDR" }]));
    render(<ResourceManager<Row, never> title="Alat" columns={columns} load={load} searchable />);
    await screen.findByText("OTDR");
    await userEvent.type(screen.getByRole("searchbox", { name: /cari/i }), "zzz");
    expect(await screen.findByText(/tidak ada data yang cocok/i)).toBeInTheDocument();
  });
});
