import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataTable from "@/components/DataTable";
import { equipmentColumns } from "@/components/equipment-columns";
import type { Equipment } from "@/services/equipment";

const base: Equipment = {
  _id: "e1", serial: "OTDR-001", name: "OTDR", category: { _id: "c1", name: "Alat ukur" },
  location: "Gudang A", condition: "good", status: "available", nextCalibration: "2026-12-01T00:00:00.000Z",
};

describe("equipment table", () => {
  it("shows status, condition and category", () => {
    render(<DataTable columns={equipmentColumns} rows={[base]} status="ready" />);
    expect(screen.getByText("OTDR-001")).toBeInTheDocument();
    expect(screen.getByText("Alat ukur")).toBeInTheDocument();
    expect(screen.getByText("Tersedia")).toBeInTheDocument();
    expect(screen.getByText("Baik")).toBeInTheDocument();
  });
  it("shows dashes for a deleted category and an empty calibration date instead of failing", () => {
    const row = { ...base, _id: "e2", category: null, nextCalibration: undefined };
    render(<DataTable columns={equipmentColumns} rows={[row]} status="ready" />);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });
  it("labels a borrowed broken unit", () => {
    render(<DataTable columns={equipmentColumns} rows={[{ ...base, status: "borrowed", condition: "broken" }]} status="ready" />);
    expect(screen.getByText("Dipinjam")).toBeInTheDocument();
    expect(screen.getByText("Rusak")).toBeInTheDocument();
  });
  it("shows the empty state for no equipment", () => {
    render(<DataTable columns={equipmentColumns} rows={[]} status="ready" />);
    expect(screen.getByText(/belum ada data/i)).toBeInTheDocument();
  });
});
