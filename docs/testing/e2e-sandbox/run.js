const { chromium } = require("playwright");
const fs = require("fs");
const OUT = __dirname + "/shots";
fs.mkdirSync(OUT, { recursive: true });
const FE = "http://localhost:3001";
const ADMIN = { email: "admin@e2e.local", password: "E2e-Sandbox-Pass-1" };
const TECH = { name: "Budi", email: "budi@e2e.local", password: "Budi-Sandbox-Pass-1" };
const results = [];
let n = 0;
const rec = (name, ok, detail = "") => { results.push({ no: ++n, name, ok, detail }); console.log(ok ? "LULUS" : "GAGAL", "-", name, detail ? `(${detail})` : ""); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const shot = (name) => page.screenshot({ path: `${OUT}/${String(n).padStart(2, "0")}-${name}.png`, fullPage: true });
  const body = async () => (await page.locator("body").innerText());
  const step = async (name, fn) => {
    try { const r = await fn(); rec(name, r === undefined ? true : !!r.ok, r?.detail ?? ""); }
    catch (e) { rec(name, false, String(e.message).split("\n")[0].slice(0, 140)); }
    try { await shot(name.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)); } catch {}
  };
  const login = async (u) => {
    await page.goto(`${FE}/auth/login`);
    await page.getByLabel("Email").fill(u.email);
    await page.getByLabel("Password").fill(u.password);
    await page.getByRole("button", { name: "Masuk" }).click();
  };
  const go = async (path) => { await page.goto(`${FE}${path}`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); };
  const openAdd = async (path, btn = "Tambah") => { await go(path); await page.getByRole("button", { name: btn, exact: true }).click(); };
  const save = async (btn = "Simpan") => { await page.getByRole("button", { name: btn, exact: true }).click(); await page.waitForTimeout(900); };
  const modalOpen = async () => (await page.locator('[role="dialog"]').count()) > 0;

  // 1. login
  await step("Login dengan password salah menampilkan error, tetap di halaman login", async () => {
    await login({ email: ADMIN.email, password: "salah-salah" });
    await page.waitForTimeout(1200);
    return { ok: page.url().includes("/auth/login") && /salah|gagal|tidak/i.test(await body()), detail: page.url() };
  });
  await step("Login admin berhasil dan masuk dashboard admin", async () => {
    await login(ADMIN);
    await page.waitForURL(/\/admin/, { timeout: 8000 });
    return { ok: /Dashboard/.test(await body()), detail: page.url() };
  });

  // 2. kategori
  await step("Admin menambah kategori 'Alat ukur fiber optik'", async () => {
    await openAdd("/admin/categories");
    await page.getByLabel("Nama").fill("Alat ukur fiber optik");
    await page.getByLabel("Jenis").selectOption("unit");
    await save();
    await go("/admin/categories");
    return { ok: /Alat ukur fiber optik/.test(await body()) };
  });
  await step("Kategori dengan nama sama beda huruf besar/kecil ditolak", async () => {
    await openAdd("/admin/categories");
    await page.getByLabel("Nama").fill("ALAT UKUR FIBER OPTIK");
    await page.getByLabel("Jenis").selectOption("unit");
    await save();
    const t = await body();
    const stillOpen = await modalOpen();
    return { ok: stillOpen && /exists|sudah/i.test(t), detail: stillOpen ? "modal tetap terbuka" : "modal tertutup (kategori kembar tersimpan?)" };
  });

  // 3. alat
  await step("Admin menambah alat OTDR (serial OTDR-001)", async () => {
    await openAdd("/admin/equipment");
    await page.getByLabel("Serial").fill("OTDR-001");
    await page.getByLabel("Nama").fill("OTDR");
    await page.getByLabel("Kategori").selectOption({ label: "Alat ukur fiber optik" });
    await page.getByLabel("Lokasi").fill("Gudang BC");
    await save();
    await go("/admin/equipment");
    const t = await body();
    return { ok: /OTDR-001/.test(t) && /Tersedia/.test(t) };
  });
  await step("Serial alat yang sama ditolak", async () => {
    await openAdd("/admin/equipment");
    await page.getByLabel("Serial").fill("OTDR-001");
    await page.getByLabel("Nama").fill("OTDR kembar");
    await page.getByLabel("Kategori").selectOption({ label: "Alat ukur fiber optik" });
    await save();
    return { ok: (await modalOpen()) && /exists|already|sudah|terdaftar/i.test(await body()) };
  });

  // 4. pengguna
  await step("Admin membuat akun teknisi Budi", async () => {
    await openAdd("/admin/users");
    await page.getByLabel("Nama", { exact: true }).fill(TECH.name);
    await page.getByLabel("Email (untuk login)").fill(TECH.email);
    await page.getByLabel(/^Password/).fill(TECH.password);
    await page.getByLabel("Peran").selectOption("technician");
    await save();
    await go("/admin/users");
    return { ok: /Budi/.test(await body()) && /Teknisi/.test(await body()) };
  });
  await step("Email teknisi yang sama ditolak", async () => {
    await openAdd("/admin/users");
    await page.getByLabel("Nama", { exact: true }).fill("Budi dua");
    await page.getByLabel("Email (untuk login)").fill(TECH.email);
    await page.getByLabel(/^Password/).fill(TECH.password);
    await page.getByLabel("Peran").selectOption("technician");
    await save();
    return { ok: (await modalOpen()) && /exists|already|sudah|terdaftar/i.test(await body()) };
  });

  // 5. peminjaman
  await step("Admin meminjamkan OTDR ke Budi", async () => {
    await go("/admin/loans");
    await page.getByRole("button", { name: "Pinjamkan alat" }).click();
    await page.locator("#b-equipment").selectOption({ index: 1 });
    await page.locator("#b-tech").selectOption({ label: "Budi" });
    await save("Pinjamkan");
    await go("/admin/loans");
    const t = await body();
    return { ok: /OTDR/.test(t) && /Budi/.test(t) && /Belum/.test(t) };
  });
  await step("OTDR yang sedang dipinjam tidak bisa dipinjam lagi (tidak ada di daftar alat tersedia)", async () => {
    await go("/admin/loans");
    await page.getByRole("button", { name: "Pinjamkan alat" }).click();
    const opts = await page.locator("#b-equipment option").allInnerTexts();
    return { ok: !opts.some((o) => /OTDR/.test(o)), detail: `pilihan: ${opts.join(" | ")}` };
  });
  await step("Admin mengembalikan OTDR dengan kondisi baik", async () => {
    await go("/admin/loans");
    await page.getByRole("button", { name: "Kembalikan" }).first().click();
    await page.locator("#r-cond").selectOption("good");
    await page.getByRole("button", { name: "Catat pengembalian", exact: true }).click();
    await page.waitForTimeout(1000);
    await go("/admin/loans");
    await page.getByLabel("Hanya yang belum dikembalikan").uncheck().catch(() => {});
    await page.waitForTimeout(600);
    return { ok: /\(Baik\)/.test(await body()) };
  });
  await step("Setelah kembali, OTDR berstatus Tersedia lagi", async () => {
    await go("/admin/equipment");
    return { ok: /Tersedia/.test(await body()) && !/Dipinjam/.test(await body()) };
  });

  // 6. stok
  await step("Admin menambah item stok Konektor SC dengan stok awal 20", async () => {
    await openAdd("/admin/stock");
    await page.getByLabel("Kode").fill("KSC");
    await page.getByLabel("Nama").fill("Konektor SC");
    await page.getByLabel("Kategori").selectOption({ label: "Aksesori fiber optik" });
    await page.getByLabel("Satuan").fill("pcs");
    await page.getByLabel("Stok minimum").fill("5");
    await page.getByLabel(/^Stok awal/).fill("20");
    await save();
    await go("/admin/stock");
    return { ok: /Konektor SC/.test(await body()) && /20 pcs/.test(await body()) };
  });
  await step("Stok awal 20 ikut tercatat di Riwayat stok sebagai Masuk", async () => {
    await go("/admin/movements");
    const t = await body();
    return { ok: /Masuk/.test(t) && /Konektor SC/.test(t) && /20 pcs/.test(t) };
  });
  await step("Stok masuk 5 untuk Konektor SC", async () => {
    await go("/admin/movements");
    await page.getByRole("button", { name: "Stok masuk" }).click();
    await page.locator("#i-item").selectOption({ label: "Konektor SC (sisa 20 pcs)" });
    await page.getByLabel("Jumlah").fill("5");
    await save("Tambah stok");
    await go("/admin/stock");
    return { ok: /25 pcs/.test(await body()) };
  });
  await step("Stok keluar 10 untuk Budi mengurangi sisa menjadi 15", async () => {
    await go("/admin/movements");
    await page.getByRole("button", { name: "Stok keluar" }).click();
    await page.locator("#o-item").selectOption({ label: "Konektor SC (sisa 25 pcs)" });
    await page.locator("#o-tech").selectOption({ label: "Budi" });
    await page.getByLabel("Jumlah").fill("10");
    await save("Keluarkan");
    await go("/admin/stock");
    return { ok: /15 pcs/.test(await body()) };
  });
  await step("Stok keluar 5000 (melebihi sisa) ditolak oleh form, stok tetap 15", async () => {
    await go("/admin/movements");
    await page.getByRole("button", { name: "Stok keluar" }).click();
    await page.locator("#o-item").selectOption({ label: "Konektor SC (sisa 15 pcs)" });
    await page.locator("#o-tech").selectOption({ label: "Budi" });
    await page.getByLabel("Jumlah").fill("5000");
    await page.waitForTimeout(400);
    const t = await body();
    const disabled = await page.getByRole("button", { name: "Keluarkan", exact: true }).isDisabled();
    await go("/admin/stock");
    return { ok: disabled && /melebihi sisa stok/i.test(t) && /15 pcs/.test(await body()), detail: "pesan 'Jumlah melebihi sisa stok (15)', tombol nonaktif, stok tetap 15" };
  });
  await step("Jumlah 0 dan -3 pada stok keluar ditolak", async () => {
    await go("/admin/movements");
    await page.getByRole("button", { name: "Stok keluar" }).click();
    await page.locator("#o-item").selectOption({ label: "Konektor SC (sisa 15 pcs)" });
    await page.locator("#o-tech").selectOption({ label: "Budi" });
    const btn = page.getByRole("button", { name: "Keluarkan", exact: true });
    await page.getByLabel("Jumlah").fill("0"); await page.waitForTimeout(300);
    const a = await btn.isDisabled();
    await page.getByLabel("Jumlah").fill("-3"); await page.waitForTimeout(300);
    const b = await btn.isDisabled();
    return { ok: a && b, detail: "tombol Keluarkan nonaktif untuk 0 dan -3" };
  });
  await step("Dashboard admin menampilkan data sesuai", async () => {
    await go("/admin");
    await page.waitForTimeout(800);
    const t = await body();
    return { ok: /Alat tersedia/.test(t) && /Stok menipis/.test(t), detail: t.replace(/\s+/g, " ").slice(0, 160) };
  });

  // 7. teknisi
  await step("Keluar dari akun admin", async () => {
    await page.getByRole("button", { name: "Keluar" }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 6000 });
  });
  await step("Login teknisi Budi dan masuk ke halaman teknisi", async () => {
    await login({ email: TECH.email, password: TECH.password });
    await page.waitForURL(/\/my/, { timeout: 8000 });
    return { ok: /Pinjaman saya/.test(await body()), detail: page.url() };
  });
  await step("Teknisi hanya punya menu Pinjaman saya, Alat, Stok", async () => {
    const nav = (await page.getByRole("navigation").allInnerTexts()).join(" ");
    return { ok: /Pinjaman saya/.test(nav) && /Alat/.test(nav) && /Stok/.test(nav) && !/Pengguna|Kategori|Riwayat stok/.test(nav), detail: nav.replace(/\s+/g, " ") };
  });
  await step("Teknisi melihat pinjaman dan pengambilan stok miliknya", async () => {
    const t = await body();
    return { ok: /OTDR/.test(t) && /Konektor SC/.test(t) && /10 pcs/.test(t) };
  });
  await step("Halaman Alat teknisi hanya-baca (tanpa Tambah/Ubah/Hapus)", async () => {
    await go("/my/equipment");
    await page.waitForTimeout(700);
    const btns = await page.getByRole("button", { name: /Tambah|Ubah|Hapus/ }).count();
    return { ok: /OTDR/.test(await body()) && btns === 0, detail: `tombol aksi=${btns}` };
  });
  await step("Halaman Stok teknisi hanya-baca (tanpa Tambah/Ubah/Hapus)", async () => {
    await go("/my/stock");
    await page.waitForTimeout(700);
    const btns = await page.getByRole("button", { name: /Tambah|Ubah|Hapus/ }).count();
    return { ok: /Konektor SC/.test(await body()) && btns === 0, detail: `tombol aksi=${btns}` };
  });
  await step("Teknisi yang membuka /admin diarahkan keluar dari area admin", async () => {
    await go("/admin");
    await page.waitForTimeout(1200);
    return { ok: !/\/admin$/.test(page.url()) && !/Alat dipinjam/.test(await body()), detail: page.url() };
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  fs.writeFileSync(__dirname + "/hasil.json", JSON.stringify(results, null, 2));
  console.log(failed ? `\n${failed} GAGAL dari ${results.length}` : `\nSemua ${results.length} pemeriksaan lulus`);
})();
