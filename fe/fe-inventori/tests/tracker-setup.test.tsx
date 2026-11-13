import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackerSetup from "@/components/TrackerSetup";
import FieldTracking from "@/components/FieldTracking";

afterEach(() => vi.restoreAllMocks());
const env = (data: unknown, status = 200) => new Response(JSON.stringify({ meta: { status, message: "m" }, data }), { status, headers: { "content-type": "application/json" } });

describe("setup Traccar Client", () => {
  it("teknisi tanpa ID membuat ID perangkat lalu melihat server URL dan langkah setup", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.rakit.test/api";
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ deviceId: "trk_abc123" }, 201));
    render(<TrackerSetup initialDeviceId={null} holding={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Buat ID perangkat saya" }));
    expect(await screen.findByText("trk_abc123")).toBeInTheDocument();
    expect(screen.getByText("https://api.rakit.test/api/traccar")).toBeInTheDocument();
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("membuat ID baru meminta konfirmasi dulu", async () => {
    const f = vi.spyOn(globalThis, "fetch");
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TrackerSetup initialDeviceId="trk_lama" holding={0} />);
    await userEvent.click(screen.getByRole("button", { name: "Buat ID baru" }));
    expect(ask).toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByText("trk_lama")).toBeInTheDocument();
  });
});

describe("privasi: tracking hanya saat memegang alat", () => {
  it("saat memegang alat: status aktif dan kartu kirim lokasi tampil", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ deviceId: "trk_a", holding: 2 }));
    await act(async () => { render(<FieldTracking />); });
    expect(await screen.findByTestId("tracking-status")).toHaveTextContent(/aktif: Anda memegang 2 alat/i);
    expect(screen.getByRole("button", { name: "Kirim lokasi saya" })).toBeInTheDocument();
  });
  it("setelah semua alat kembali: status nonaktif dan tidak ada kirim lokasi sama sekali", async () => {
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ deviceId: "trk_a", holding: 0 }));
    await act(async () => { render(<FieldTracking />); });
    expect(await screen.findByTestId("tracking-status")).toHaveTextContent(/nonaktif/i);
    expect(screen.queryByRole("button", { name: "Kirim lokasi saya" })).toBeNull();
    expect(f.mock.calls.every(([u]) => !String(u).includes("/checkin"))).toBe(true);
  });
});
