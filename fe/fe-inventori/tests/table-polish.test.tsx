import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataTable from "@/components/DataTable";
import DashboardView from "@/components/DashboardView";
import type { AdminDashboard } from "@/services/dashboard";

describe("DataTable numeric columns", () => {
  it("right-aligns a numeric column in header and cells", () => {
    render(
      <DataTable<{ _id: string; n: number }>
        columns={[{ header: "Jumlah", numeric: true, render: (r) => r.n }]}
        rows={[{ _id: "1", n: 7 }]}
        status="ready"
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Jumlah" })).toHaveClass("text-right");
    expect(screen.getByRole("cell", { name: "7" })).toHaveClass("text-right", "tabular-nums");
  });
});

describe("DataTable on narrow screens", () => {
  it("keeps each cell on one line so the table scrolls sideways instead of wrapping into tall rows", () => {
    render(
      <DataTable<{ _id: string; name: string }>
        columns={[{ header: "Nama", render: (r) => r.name }]}
        rows={[{ _id: "1", name: "Kabel Precon 350 m" }]}
        status="ready"
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Nama" })).toHaveClass("whitespace-nowrap");
    expect(screen.getByRole("cell", { name: "Kabel Precon 350 m" })).toHaveClass("whitespace-nowrap");
  });
});

const base: AdminDashboard = {
  equipmentByStatus: { available: 1, borrowed: 0 },
  equipmentByCondition: { good: 1, broken: 0, repair: 0 },
  activeLoans: 0, overdueLoansCount: 0, overdueLoans: [], calibrationDueCount: 0, calibrationDue: [],
  equipmentByCategory: [], overdueDays: 7,
};
const now = Date.parse("2026-10-24T00:00:00Z");

describe("DashboardView tones", () => {
  it("flags broken equipment as danger and stays calm when nothing is wrong", () => {
    const { rerender } = render(<DashboardView data={base} now={now} />);
    expect(screen.getByLabelText("Alat rusak atau perbaikan")).toHaveAttribute("data-tone", "ok");
    rerender(<DashboardView data={{ ...base, equipmentByCondition: { good: 0, broken: 1, repair: 0 } }} now={now} />);
    expect(screen.getByLabelText("Alat rusak atau perbaikan")).toHaveAttribute("data-tone", "danger");
  });
  it("marks overdue loans danger and calibration calm, only when there are any", () => {
    render(
      <DashboardView
        now={now}
        data={{ ...base, overdueLoansCount: 2 }}
      />,
    );
    expect(screen.getByRole("heading", { name: /pinjaman terlambat/i }).closest("section")).toHaveAttribute("data-tone", "danger");
    expect(screen.getByRole("heading", { name: /kalibrasi jatuh tempo/i }).closest("section")).toHaveAttribute("data-tone", "ok");
  });
});

describe("DataTable di layar sempit (kartu)", () => {
  it("memberi setiap sel label kolomnya supaya bisa tampil sebagai kartu berlabel", () => {
    render(
      <DataTable<{ _id: string; name: string; n: number }>
        columns={[
          { header: "Nama", render: (r) => r.name },
          { header: "Jumlah", numeric: true, render: (r) => r.n },
        ]}
        rows={[{ _id: "1", name: "Kabel Precon 350 m", n: 7 }]}
        status="ready"
      />,
    );
    expect(screen.getByRole("cell", { name: "Kabel Precon 350 m" })).toHaveAttribute("data-label", "Nama");
    expect(screen.getByRole("cell", { name: "7" })).toHaveAttribute("data-label", "Jumlah");
  });
  it("menyembunyikan baris judul kolom di layar sempit tanpa menghapusnya dari pembaca layar desktop", () => {
    render(
      <DataTable<{ _id: string; name: string }>
        columns={[{ header: "Nama", render: (r) => r.name }]}
        rows={[{ _id: "1", name: "A" }]}
        status="ready"
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Nama" }).closest("thead")).toHaveClass("max-md:hidden");
  });
});
