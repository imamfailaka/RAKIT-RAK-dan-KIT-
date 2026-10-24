import mongoose from "mongoose";
import * as Yup from "yup";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
// Unique regardless of letter case: "Alat ukur" and "alat ukur" are the same category.
schema.index({ name: 1 }, { unique: true, name: "name_ci_unique", collation: { locale: "en", strength: 2 } });

export const categoryDTO = Yup.object({
  name: Yup.string().trim().required("Nama kategori wajib diisi"),
});

export default mongoose.models.Category || mongoose.model("Category", schema);
