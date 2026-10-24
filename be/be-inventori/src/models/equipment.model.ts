import mongoose from "mongoose";
import * as Yup from "yup";

const schema = new mongoose.Schema(
  {
    serial: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    location: { type: String, default: "" },
    condition: { type: String, enum: ["good", "broken", "repair"], default: "good" },
    status: { type: String, enum: ["available", "borrowed"], default: "available" },
    lastCalibration: { type: Date },
    nextCalibration: { type: Date },
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);
schema.index({ name: "text", serial: "text" });

export const equipmentDTO = Yup.object({
  serial: Yup.string().trim().required("Serial wajib diisi"),
  name: Yup.string().trim().required("Nama wajib diisi"),
  category: Yup.string().required("Kategori wajib diisi"),
  location: Yup.string().default(""),
  condition: Yup.string().oneOf(["good", "broken", "repair"], "Kondisi tidak valid"),
  lastCalibration: Yup.date().typeError("Tanggal tidak valid").nullable(),
  nextCalibration: Yup.date().typeError("Tanggal tidak valid").nullable(),
  photo: Yup.string(),
});

export const equipmentUpdateDTO = equipmentDTO.partial();

export default mongoose.models.Equipment || mongoose.model("Equipment", schema);
