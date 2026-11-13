import { Response } from "express";
import LocationLogModel from "../models/location-log.model";
import UserModel from "../models/user.model";
import { newTrackerId, parseTraccar } from "../services/traccar";
import { IReqUser } from "../middlewares/auth";
import { latestPerTechnician, parseLocation, type GeoPoint, type LocationEntry, type LocationEvent } from "../services/location";
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

export default {
  /** Teknisi menekan "Kirim lokasi saya" (check-in) dari HP. */
  async checkin(req: IReqUser, res: Response) {
    try {
      const p = parseLocation(req.body);
      if (!p.ok) return response.badRequest(res, p.message, { location: p.message });
      const doc = await LocationLogModel.create({ technician: req.user!.id, event: "checkin", ...p.location, at: new Date() });
      response.created(res, { id: String(doc._id), at: doc.at }, "success checkin");
    } catch (error) {
      response.error(res, error, "failed to checkin");
    }
  },
  /** Teknisi: lihat ID perangkat Traccar miliknya (null bila belum dibuat). */
  async tracker(req: IReqUser, res: Response) {
    try {
      const user = await UserModel.findById(req.user!.id).select("+trackerId").lean<{ trackerId?: string }>();
      response.success(res, { deviceId: user?.trackerId ?? null }, "success get tracker");
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
   * hanya teknisi aktif yang diterima. Selalu menjawab cepat agar aplikasi tidak menumpuk antrean.
   */
  async traccar(req: IReqUser, res: Response) {
    try {
      const point = parseTraccar((req.query ?? {}) as Record<string, unknown>, req.body, new Date());
      if (!point) return response.badRequest(res, "invalid location data");
      const user = await UserModel.findOne({ trackerId: point.deviceId, role: "technician", isActive: true }).select("_id").lean<{ _id: unknown }>();
      if (!user) return response.notFound(res, "unknown device");
      await LocationLogModel.create({ technician: user._id, event: "auto", ...point.location, at: point.at });
      response.success(res, null, "ok");
    } catch (error) {
      response.error(res, error, "failed to save location");
    }
  },
  /** Admin: posisi terakhir tiap teknisi + riwayat lokasi (default 7 hari terakhir). */
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
          technicianName: d.technician.name,
          event: d.event,
          serial: d.equipment?.serial,
          equipmentName: d.equipment?.name,
          lat: d.lat,
          lng: d.lng,
          accuracy: d.accuracy,
          at: d.at,
        }));
      const latest = latestPerTechnician(history, new Date(), env.LOCATION_STALE_HOURS);
      response.success(res, { latest, history, staleHours: env.LOCATION_STALE_HOURS }, "success list locations");
    } catch (error) {
      response.error(res, error, "failed to list locations");
    }
  },
};
