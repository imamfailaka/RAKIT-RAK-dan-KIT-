import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    borrowedAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null },
    returnCondition: { type: String, enum: ["good", "broken", "repair"] },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);
schema.index({ equipment: 1, returnedAt: 1 });
schema.index({ technician: 1, returnedAt: 1 });

export default mongoose.models.Loan || mongoose.model("Loan", schema);
