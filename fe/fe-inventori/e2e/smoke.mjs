// Browser smoke test against the stub API. Run `npm run build && npx next start -p 3001` first.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";

const results = [];
const vis = (loc) => loc.waitFor({ state: "visible", timeout: 8000 }).then(() => true, () => false);
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`); };

const stub = spawn("node", [new URL("./stub-api.mjs", import.meta.url).pathname], { stdio: "inherit" });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const B = "http://localhost:3001";

async function login(email) {
  await page.goto(`${B}/auth/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Passw0rd1");
  await page.getByRole("button", { name: "Masuk" }).click();
}

try {
  await page.goto(`${B}/admin/equipment`);
  await page.waitForURL(/\/auth\/login\?next=/, { timeout: 8000, waitUntil: "commit" });
  check("tanpa login /admin diarahkan ke login dengan next", true, page.url());

  // the stub answers a wrong-credentials 400 for any email it does not know
  await page.getByLabel("Email").fill("nobody@x.id");
  await page.getByLabel("Password").fill("salah12345");
  await page.getByRole("button", { name: "Masuk" }).click();
  check("email/password salah menampilkan pesan, bukan error server", await vis(page.getByText("Email atau password salah")));

  await page.getByLabel("Email").fill("admin@x.id");
  await page.getByLabel("Password").fill("Passw0rd1");
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin\/equipment/, { timeout: 8000, waitUntil: "commit" });
  check("setelah login kembali ke halaman tujuan (next)", true, page.url());
  check("daftar alat tampil; kategori hilang jadi '-'", (await vis(page.getByText("OTDR-001"))) && (await vis(page.getByText("SPL-777"))) && (await page.getByText("-", { exact: true }).count()) > 0);

  await page.goto(`${B}/admin`);
  check("dashboard admin tampil", await vis(page.getByRole("heading", { name: "Dashboard" })) && await vis(page.getByLabel("Pinjaman aktif")));

  await page.goto(`${B}/admin/loans`);
  await page.getByRole("button", { name: "Pinjamkan alat" }).click();
  await page.getByLabel("Alat", { exact: true }).selectOption("E1");
  await page.getByLabel("Teknisi", { exact: true }).selectOption("T1");
  await page.getByRole("button", { name: "Pinjamkan", exact: true }).click();
  check("alat berhasil dipinjamkan dan muncul di daftar", await vis(page.getByRole("cell", { name: /OTDR/ }).first()));

  await page.getByRole("button", { name: "Pinjamkan alat" }).click();
  await page.getByLabel("Alat", { exact: true }).selectOption("E1");
  await page.getByLabel("Teknisi", { exact: true }).selectOption("T1");
  await page.getByRole("button", { name: "Pinjamkan", exact: true }).click();
  check("meminjam alat yang sama lagi menampilkan pesan konflik", await vis(page.getByText("equipment is already borrowed")));
  await page.keyboard.press("Escape");
  await page.reload();

  await page.getByRole("button", { name: "Kembalikan" }).first().click();
  await page.getByLabel("Kondisi saat kembali").selectOption("broken");
  await page.getByRole("button", { name: "Catat pengembalian" }).click();
  check("pengembalian dicatat", await vis(page.getByText("Pengembalian dicatat.")));

  await page.getByRole("button", { name: "Keluar", exact: true }).first().click().catch(() => {});
  await page.context().clearCookies();
  await login("tech@x.id");
  await page.waitForURL(`${B}/my/scan`, { timeout: 8000, waitUntil: "commit" });
  await page.goto(`${B}/scan/c/c1`);
  await page.getByRole("button", { name: "Pinjam" }).first().click();
  check("scan kategori: teknisi meminjam unit tersedia", await vis(page.getByText(/berhasil dipinjam/i)));
  check("scan kategori: unit yang baru dipinjam bisa dikembalikan oleh peminjamnya", await vis(page.getByRole("button", { name: "Kembalikan" })));
  await page.goto(`${B}/my`);
  check("teknisi masuk ke halaman pinjaman saya", await vis(page.getByRole("heading", { name: "Pinjaman saya" })));
  await page.goto(`${B}/admin`);
  check("teknisi tidak boleh masuk /admin", new URL(page.url()).pathname === "/my");

  stub.kill();
  await new Promise((r) => setTimeout(r, 500));
  await page.goto(`${B}/my`);
  check("API mati: tampil pesan gagal + tombol coba lagi", await vis(page.getByRole("button", { name: /coba lagi/i }).first()));
  check("tidak ada error JavaScript di halaman", errors.length === 0, errors.join(" | "));
} catch (e) {
  check("skrip berjalan sampai selesai", false, String(e).split("\n")[0]);
} finally {
  stub.kill();
  await browser.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} lulus`);
process.exit(failed ? 1 : 0);
