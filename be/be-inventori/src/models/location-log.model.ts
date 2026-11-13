import mongoose from "mongoose";

/** Jejak lokasi HP teknisi saat pinjam, kembali, atau check-in. Disimpan 90 hari lalu dihapus otomatis. */
const schema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", default: null },
    event: { type: String, enum: ["borrow", "return", "checkin"], required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
schema.index({ technician: 1, at: -1 });
schema.index({ at: 1 }, { expireAfterSeconds: 90 * 24 * 3600, name: "ttl_90d" });

export default mongoose.models.LocationLog || mongoose.model("LocationLog", schema);
