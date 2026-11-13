import { describe, it, expect, vi, beforeEach } from "vitest";
import LocationLogModel from "../src/models/location-log.model";
import UserModel from "../src/models/user.model";
import locationController from "../src/controllers/location.controller";

beforeEach(() => vi.restoreAllMocks());

function res() {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}
const userQuery = (doc: unknown) => ({ select: () => ({ lean: async () => doc }) });

describe("penerima Traccar Client", () => {
  it("menyimpan titik otomatis untuk teknisi aktif pemilik ID perangkat", async () => {
    const find = vi.spyOn(UserModel, "findOne").mockReturnValue(userQuery({ _id: "T1" }) as never);
    const create = vi.spyOn(LocationLogModel, "create").mockResolvedValue({} as never);
    const r = res();
    await locationController.traccar({ query: { id: "trk_x", lat: "-6.9", lon: "107.6", accuracy: "12" }, body: {} } as never, r);
    expect(find).toHaveBeenCalledWith({ trackerId: "trk_x", role: "technician", isActive: true });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ technician: "T1", event: "auto", lat: -6.9, lng: 107.6, accuracy: 12 }));
    expect(r.status).toHaveBeenCalledWith(200);
  });
  it("menolak ID perangkat yang tidak dikenal tanpa menyimpan apa pun", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue(userQuery(null) as never);
    const create = vi.spyOn(LocationLogModel, "create");
    const r = res();
    await locationController.traccar({ query: { id: "palsu", lat: "1", lon: "2" }, body: {} } as never, r);
    expect(r.status).toHaveBeenCalledWith(404);
    expect(create).not.toHaveBeenCalled();
  });
  it("menolak data tidak lengkap dengan 400", async () => {
    const r = res();
    await locationController.traccar({ query: {}, body: {} } as never, r);
    expect(r.status).toHaveBeenCalledWith(400);
  });
});
