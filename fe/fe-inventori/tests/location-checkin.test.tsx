import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationCheckin from "@/components/LocationCheckin";

const env = (data: unknown, status = 200) => new Response(JSON.stringify({ meta: { status, message: "m" }, data }), { status, headers: { "content-type": "application/json" } });

function gps(mode: "ok" | "denied", permission: PermissionState = "prompt") {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) =>
        mode === "ok"
          ? ok({ coords: { latitude: -6.9, longitude: 107.6, accuracy: 8 } } as GeolocationPosition)
          : fail({ code: 1, message: "denied" } as GeolocationPositionError),
    },
  });
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: () => Promise.resolve({ state: permission }) },
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("check-in lokasi teknisi", () => {
  it("mengingatkan bila belum kirim lokasi hari ini, lalu mengirim saat tombol ditekan", async () => {
    gps("ok");
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ id: "x", at: new Date().toISOString() }, 201));
    render(<LocationCheckin />);
    expect(screen.getByText(/belum mengirim lokasi hari ini/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Kirim lokasi saya" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/berhasil dikirim/i);
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toMatch(/\/locations\/checkin$/);
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ location: { lat: -6.9, lng: 107.6, accuracy: 8 } });
    expect(screen.getByText(/terakhir terkirim/i)).toBeInTheDocument();
  });
  it("mengirim otomatis saat dibuka bila izin lokasi sudah diberikan", async () => {
    gps("ok", "granted");
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ id: "x", at: new Date().toISOString() }, 201));
    render(<LocationCheckin />);
    expect(await screen.findByText(/terkirim otomatis/i)).toBeInTheDocument();
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("menampilkan petunjuk bila izin lokasi ditolak", async () => {
    gps("denied");
    const f = vi.spyOn(globalThis, "fetch");
    render(<LocationCheckin />);
    await userEvent.click(screen.getByRole("button", { name: "Kirim lokasi saya" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/ikon gembok/i);
    expect(f).not.toHaveBeenCalled();
  });
});
