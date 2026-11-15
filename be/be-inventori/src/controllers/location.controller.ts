import { Response } from "express";
import LocationLogModel from "../models/location-log.model";
import UserModel from "../models/user.model";
import LoanModel from "../models/loan.model";
import { newTrackerId, parseTraccar } from "../services/traccar";
import { IReqUser } from "../middlewares/auth";
import { latestPerTechnician, onlyHolding, parseLocation, type GeoPoint, type LocationEntry, type LocationEvent } from "../services/location";
import { env } from "../utils/env";
import response from "../utils/response";

/** Mencatat posisi HP teknisi. Gagal simpan tidak boleh membatalkan pinjam/kembali yang sudah sukses. */
export async function recordLocation(technician: string, event: LocationEvent, location: GeoPoint, equipment?: string) {
  try {
    await LocationLogModel.create({ technician, event, equipment: equipment ?? null, ...location, at: new Date() });
  } catch (error) {
    console.error("failed to record location", error);
  }
}

/** Jumlah alat yang sedang dipegang teknisi. Tracking hanya berlaku selama angka ini > 0 (privasi). */
export const holdingCount = (technician: unknown) => LoanModel.countDocuments({ technician, returnedAt: null });

export const NOT_HOLDING = "tidak ada alat yang sedang dipinjam, lokasi tidak dicatat";

export default {
  /** Teknisi menekan "Kirim lokasi saya" (check-in) dari HP. */
  async checkin(req: IReqUser, res: Response) {
    try {
      const p = parseLocation(req.body);
      if (!p.ok) return response.badRequest(res, p.message, { location: p.message });
      if ((await holdingCount(req.user!.id)) === 0) return response.conflict(res, NOT_HOLDING);
      const doc = await LocationLogModel.create({ technician: req.user!.id, event: "checkin", ...p.location, at: new Date() });
      response.created(res, { id: String(doc._id), at: doc.at }, "success checkin");
    } catch (error) {
      response.error(res, error, "failed to checkin");
    }
  },
  /** Teknisi: ID perangkat Traccar miliknya (null bila belum dibuat) dan jumlah alat yang dipegang. */
  async tracker(req: IReqUser, res: Response) {
    try {
      const [user, holding] = await Promise.all([
        UserModel.findById(req.user!.id).select("+trackerId").lean<{ trackerId?: string }>(),
        holdingCount(req.user!.id),
      ]);
      response.success(res, { deviceId: user?.trackerId ?? null, holding }, "success get tracker");
    } catch (error) {
      response.error(res, error, "failed to get tracker");
    }
  },
  /** Teknisi: buat (atau ganti) ID perangkat. ID lama langsung tidak berlaku, mis. bila HP hilang. */
  async newTracker(req: IReqUser, res: Response) {
    try {
      const deviceId = newTrackerId();
      await UserModel.updateOne({ _id: req.user!.id }, { $set: { trackerId: deviceId } });
      response.created(res, { deviceId }, "success create tracker");
    } catch (error) {
      response.error(res, error, "failed to create tracker");
    }
  },
  /**
   * Penerima data aplikasi Traccar Client (tanpa JWT). ID perangkat yang acak berfungsi sebagai kunci;
   * hanya teknisi aktif yang diterima. Privasi: titik HANYA disimpan selama teknisi memegang alat; setelah
   * semua alat kembali, kiriman dibuang (dijawab 200 supaya aplikasi tidak menumpuk antrean kirim ulang).
   */
  async traccar(req: IReqUser, res: Response) {
    try {
      const point = parseTraccar((req.query ?? {}) as Record<string, unknown>, req.body, new Date());
      if (!point) return response.badRequest(res, "invalid location data");
      const user = await UserModel.findOne({ trackerId: point.deviceId, role: "technician", isActive: true }).select("_id").lean<{ _id: unknown }>();
      if (!user) return response.notFound(res, "unknown device");
      if ((await holdingCount(user._id)) === 0) return response.success(res, null, "ignored: no active loan");
      await LocationLogModel.create({ technician: user._id, event: "auto", ...point.location, at: point.at });
      response.success(res, null, "ok");
    } catch (error) {
      response.error(res, error, "failed to save location");
    }
  },
  /** Admin: posisi terakhir teknisi yang sedang memegang alat + riwayat lokasi (default 7 hari terakhir). */
  async list(req: IReqUser, res: Response) {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
      const since = new Date(Date.now() - days * 86_400_000);
      const docs = await LocationLogModel.find({ at: { $gte: since } })
        .populate("technician", "name")
        .populate("equipment", "name serial")
        .sort({ at: -1 })
        .limit(5000)
        .lean();
      const history: LocationEntry[] = docs
        .filter((d: any) => d.technician)
        .map((d: any) => ({
          id: String(d._id),
          technicianId: String(d.technician._id),
          technicianName: d.technician.name ?? "-",
          event: d.event,
          serial: d.equipment?.serial,
          equipmentName: d.equipment?.name,
          lat: d.lat,
          lng: d.lng,
          accuracy: d.accuracy,
          at: d.at,
        }));
      const open = await LoanModel.aggregate<{ _id: unknown; n: number }>([
        { $match: { returnedAt: null } },
        { $group: { _id: "$technician", n: { $sum: 1 } } },
      ]);
      const holding = new Map(open.map((o) => [String(o._id), o.n]));
      // Privasi: posisi terkini hanya untuk teknisi yang masih memegang alat.
      const latest = onlyHolding(latestPerTechnician(history, new Date(), env.LOCATION_STALE_HOURS), holding);
      response.success(res, { latest, history, staleHours: env.LOCATION_STALE_HOURS }, "success list locations");
    } catch (error) {
      response.error(res, error, "failed to list locations");
    }
  },
};
