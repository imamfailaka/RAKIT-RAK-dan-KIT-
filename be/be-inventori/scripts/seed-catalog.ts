import "dotenv/config";
import mongoose from "mongoose";
import CategoryModel from "../src/models/category.model";
import { STARTER_CATEGORIES } from "../src/data/starter-catalog";

/** Idempotent: kategori yang sudah ada (dicocokkan lewat nama) tidak diubah. */
async function main() {
  await mongoose.connect(process.env.DATABASE_URL || "", { dbName: "db-inventori" });
  for (const c of STARTER_CATEGORIES) {
    const res = await CategoryModel.updateOne({ name: c.name }, { $setOnInsert: c }, { upsert: true });
    console.log(`${c.name}: ${res.upsertedCount ? "dibuat" : "sudah ada"}`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
