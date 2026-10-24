import "dotenv/config";
import mongoose from "mongoose";
import CategoryModel from "../src/models/category.model";
import EquipmentModel from "../src/models/equipment.model";
import { INITIAL_EQUIPMENT } from "../src/data/sample-data";

/**
 * Daftar alat Biznet Duri Pulo. Jalankan `npm run seed:catalog` lebih dulu.
 * Aman diulang: alat dengan serial yang sudah ada dilewati.
 */
async function main() {
  await mongoose.connect(process.env.DATABASE_URL || "", { dbName: "db-inventori" });
  const cats = new Map<string, unknown>((await CategoryModel.find().lean()).map((c: any) => [c.name, c._id]));
  for (const e of INITIAL_EQUIPMENT) {
    const category = cats.get(e.category);
    if (!category) { console.log(`${e.serial}: kategori "${e.category}" belum ada (jalankan seed:catalog)`); continue; }
    const res = await EquipmentModel.updateOne({ serial: e.serial }, { $setOnInsert: { ...e, category } }, { upsert: true });
    console.log(`${e.serial}: ${res.upsertedCount ? "dibuat" : "sudah ada"}`);
  }

  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
