import "dotenv/config";
import mongoose from "mongoose";
import UserModel from "../src/models/user.model";
import { hashPassword } from "../src/utils/password";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
  await mongoose.connect(process.env.DATABASE_URL || "", { dbName: "db-inventori" });
  const exists = await UserModel.findOne({ email: email.toLowerCase() });
  if (exists) console.log("admin already exists");
  else {
    await UserModel.create({ name: "Administrator", email, password: hashPassword(password), role: "admin" });
    console.log("admin created");
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
