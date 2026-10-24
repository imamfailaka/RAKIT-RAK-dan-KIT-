import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BorrowForm from "@/components/BorrowForm";
import { ToastProvider } from "@/components/Toast";
import { ApiError } from "@/lib/errors";
import type { Equipment } from "@/services/equipment";
import type { AppUser } from "@/services/users";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const equipment: Equipment[] = [{ _id: "E1", serial: "OTDR-1", name: "OTDR", category: null, condition: "good", status: "available" }];
const technicians: AppUser[] = [{ _id: "T1", name: "Budi", email: "b@x.id", role: "technician", isActive: true }];

const setup = (submit: (i: { equipment: string; technician: string; note?: string }) => Promise<unknown>, onDone = vi.fn()) => {
  render(
    <ToastProvider>
      <BorrowForm equipment={equipment} technicians={technicians} submit={submit} onDone={onDone} />
    </ToastProvider>,
  );
  return onDone;
};
const fill = async () => {
  await userEvent.selectOptions(screen.getByLabelText("Alat"), "E1");
  await userEvent.selectOptions(screen.getByLabelText("Teknisi"), "T1");
};

beforeEach(() => vi.clearAllMocks());

describe("BorrowForm", () => {
  it("does not submit until both a unit and a technician are chosen", async () => {
    const submit = vi.fn();
    setup(submit);
    expect(screen.getByRole("button", { name: /pinjamkan/i })).toBeDisabled();
  });
  it("sends only one request on a fast double click", async () => {
    let release: () => void = () => {};
    const submit = vi.fn(() => new Promise<void>((r) => { release = r; }));
    setup(submit);
    await fill();
    const btn = screen.getByRole("button", { name: /pinjamkan/i });
    await userEvent.dblClick(btn);
    expect(submit).toHaveBeenCalledTimes(1);
    release();
  });
  it("shows the backend conflict message instead of a generic server error", async () => {
    const submit = vi.fn().mockRejectedValue(new ApiError(409, null, "equipment is already borrowed"));
    setup(submit);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /pinjamkan/i }));
    expect(await screen.findByText("Alat ini sedang dipinjam.")).toBeInTheDocument();
    expect(screen.queryByText(/kesalahan pada server/i)).not.toBeInTheDocument();
  });
  it("calls onDone after a successful loan", async () => {
    const submit = vi.fn().mockResolvedValue({});
    const onDone = setup(submit);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /pinjamkan/i }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(submit).toHaveBeenCalledWith({ equipment: "E1", technician: "T1", note: undefined });
  });
});
