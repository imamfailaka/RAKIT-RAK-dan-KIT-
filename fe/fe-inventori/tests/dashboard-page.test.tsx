import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardView from "@/components/DashboardView";
import type { AdminDashboard } from "@/services/dashboard";

const empty: AdminDashboard = {
  equipmentByStatus: { available: 0, borrowed: 0 },
  equipmentByCondition: { good: 0, broken: 0, repair: 0 },
  activeLoans: 0,
  overdueLoansCount: 0,
  overdueLoans: [],
  calibrationDueCount: 0,
  calibrationDue: [],
  equipmentByCategory: [],
  overdueDays: 7,
};

describe("DashboardView", () => {
  it("renders zeros and explicit empty messages instead of blank sections", () => {
    render(<DashboardView data={empty} now={Date.parse("2026-10-24T00:00:00Z")} />);
    expect(screen.getByText(/tidak ada pinjaman terlambat/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak ada kalibrasi/i)).toBeInTheDocument();
    expect(screen.getByText(/belum ada alat/i)).toBeInTheDocument();
  });
  it("shows counts and does not fail on loans whose equipment or technician was removed", () => {
    render(
      <DashboardView
        now={Date.parse("2026-10-24T00:00:00Z")}
        data={{
          ...empty,
          activeLoans: 3,
          equipmentByStatus: { available: 4, borrowed: 3 },
          overdueLoansCount: 1,
          overdueLoans: [{ _id: "L1", borrowedAt: "2026-10-01T00:00:00Z", equipment: null, technician: null }],
          equipmentByCategory: [{ name: "Alat ukur", count: 7 }],
        }}
      />,
    );
    expect(screen.getByText("Alat ukur")).toBeInTheDocument();
    expect(screen.getByLabelText(/pinjaman aktif/i)).toHaveTextContent("3");
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
  it("kartu angka adalah tautan ke daftar terkait", () => {
    render(<DashboardView data={empty} now={Date.parse("2026-10-24T00:00:00Z")} />);
    expect(screen.getByRole("link", { name: /alat tersedia/i })).toHaveAttribute("href", "/admin/equipment");
    expect(screen.getByRole("link", { name: /alat dipinjam/i })).toHaveAttribute("href", "/admin/loans");
    expect(screen.getByRole("link", { name: /pinjaman aktif/i })).toHaveAttribute("href", "/admin/loans");
  });
  it("menampilkan tanggal hari ini dan nama perusahaan", () => {
    render(<DashboardView data={empty} now={Date.parse("2026-10-24T05:00:00Z")} />);
    expect(screen.getByText(/24 Oktober 2026/)).toBeInTheDocument();
    expect(screen.getByText(/PT\. Supra Primatama Nusantara/)).toBeInTheDocument();
  });
  it("menggambar kondisi alat sebagai bar dengan teks pengganti", () => {
    render(<DashboardView data={{ ...empty, equipmentByCondition: { good: 8, broken: 1, repair: 1 } }} now={Date.parse("2026-10-24T00:00:00Z")} />);
    expect(screen.getByRole("img", { name: /kondisi alat: 8 baik, 1 rusak, 1 perbaikan/i })).toBeInTheDocument();
  });
  it("meminta ringkasan jumlah alat per kategori", () => {
    render(<DashboardView data={{ ...empty, equipmentByCategory: [{ name: "Alat ukur", count: 7 }, { name: "Alat kerja", count: 2 }] }} now={Date.parse("2026-10-24T00:00:00Z")} />);
    expect(screen.getByRole("heading", { name: /alat per kategori/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alat ukur\s*7/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alat kerja\s*2/i })).toBeInTheDocument();
  });
});
