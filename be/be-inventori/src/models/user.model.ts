import mongoose from "mongoose";
import * as Yup from "yup";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "technician"], default: "technician" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const userCreateDTO = Yup.object({
  name: Yup.string().trim().required("Nama wajib diisi"),
  email: Yup.string().trim().email("Email tidak valid").required("Email wajib diisi"),
  password: Yup.string()
    .min(8, "Password minimal 8 karakter")
    .matches(/[A-Za-z]/, "Password harus mengandung huruf")
    .matches(/[0-9]/, "Password harus mengandung angka")
    .required("Password wajib diisi"),
  role: Yup.string().oneOf(["admin", "technician"], "Role tidak valid").default("technician"),
  isActive: Yup.boolean().default(true),
});

export const userUpdateDTO = Yup.object({
  name: Yup.string().trim().min(1, "Nama wajib diisi"),
  email: Yup.string().trim().email("Email tidak valid"),
  password: Yup.string()
    .min(8, "Password minimal 8 karakter")
    .matches(/[A-Za-z]/, "Password harus mengandung huruf")
    .matches(/[0-9]/, "Password harus mengandung angka"),
  role: Yup.string().oneOf(["admin", "technician"], "Role tidak valid"),
  isActive: Yup.boolean(),
});

const UserModel = mongoose.models.User || mongoose.model("User", schema);
export default UserModel;
