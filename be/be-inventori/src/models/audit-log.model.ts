import mongoose from "mongoose";

/**
 * Catatan audit: siapa melakukan apa, kapan, terhadap data apa. Hanya ditambah, tidak pernah diubah.
 * Nama dan peran pelaku disalin saat kejadian, supaya catatan tetap terbaca walau akunnya diubah/dihapus.
 * Disimpan 1 tahun lalu dihapus otomatis.
 */
const schema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    targetLabel: { type: String, default: "" },
    detail: { type: String, default: "" },
    ip: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
schema.index({ at: -1 });
schema.index({ action: 1, at: -1 });
schema.index({ at: 1 }, { expireAfterSeconds: 365 * 24 * 3600, name: "ttl_365d" });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", schema);
