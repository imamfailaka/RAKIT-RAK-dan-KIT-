import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import LocationsPage from "@/app/admin/locations/page";

vi.mock("@/components/LocationMap", () => ({ default: () => <div data-testid="location-map" /> }));
afterEach(() => vi.restoreAllMocks());

const env = (data: unknown) => new Response(JSON.stringify({ meta: { status: 200, message: "m" }, data }), { status: 200, headers: { "content-type": "application/json" } });
const pos = (over = {}) => ({ id: "1", technicianId: "T1", technicianName: "Budi", event: "borrow", serial: "W33", lat: -6.9, lng: 107.6, at: "2026-11-14T03:00:00Z", stale: false, ...over });

describe("peta teknisi (admin)", () => {
  it("menampilkan peta dan status aktif / lama tidak update per teknisi", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      env({ latest: [pos(), pos({ technicianId: "T2", technicianName: "Sari", event: "checkin", serial: undefined, stale: true })], history: [pos()], staleHours: 4 }),
    );
    await act(async () => { render(<LocationsPage />); });
    expect(await screen.findByTestId("location-map")).toBeInTheDocument();
    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("Lama tidak update")).toBeInTheDocument();
    expect(screen.getByText(/lebih dari 4 jam/)).toBeInTheDocument();
  });
});
