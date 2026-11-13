import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackerSetup from "@/components/TrackerSetup";

afterEach(() => vi.restoreAllMocks());
const env = (data: unknown, status = 200) => new Response(JSON.stringify({ meta: { status, message: "m" }, data }), { status, headers: { "content-type": "application/json" } });

describe("setup Traccar Client", () => {
  it("teknisi tanpa ID membuat ID perangkat lalu melihat server URL dan langkah setup", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.rakit.test/api";
    const f = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) =>
      Promise.resolve((init as RequestInit)?.method === "POST" ? env({ deviceId: "trk_abc123" }, 201) : env({ deviceId: null })),
    );
    await act(async () => { render(<TrackerSetup />); });
    await userEvent.click(await screen.findByRole("button", { name: "Buat ID perangkat saya" }));
    expect(await screen.findByText("trk_abc123")).toBeInTheDocument();
    expect(screen.getByText("https://api.rakit.test/api/traccar")).toBeInTheDocument();
    expect(screen.getByText(/Traccar Client/, { selector: "b" })).toBeInTheDocument();
    expect(f.mock.calls.filter(([, i]) => (i as RequestInit)?.method === "POST")).toHaveLength(1);
  });
  it("membuat ID baru meminta konfirmasi dulu", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(env({ deviceId: "trk_lama" }));
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);
    await act(async () => { render(<TrackerSetup />); });
    await userEvent.click(await screen.findByRole("button", { name: "Buat ID baru" }));
    expect(ask).toHaveBeenCalled();
    expect(screen.getByText("trk_lama")).toBeInTheDocument();
  });
});
