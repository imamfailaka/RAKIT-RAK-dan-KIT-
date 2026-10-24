// End-to-end API check against a running backend + real database, including simultaneous requests.
// Usage: BASE=http://localhost:3000/api ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/api-smoke.mjs
// It creates uniquely named test data (prefix "smoke-") and does not delete anything.
const BASE = process.env.BASE || "http://localhost:3000/api";
const AE = process.env.ADMIN_EMAIL, AP = process.env.ADMIN_PASSWORD;
if (!AE || !AP) { console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD"); process.exit(2); }
const tag = `smoke-${Date.now().toString(36)}`;
console.log("api-smoke v2 ->", BASE);
const rows = [];
let failed = 0;
const check = (name, ok, detail = "") => { rows.push([ok ? "LULUS" : "GAGAL", name, detail]); if (!ok) failed++; };

async function call(method, path, token, body) {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, data: json?.data };
}
const need = (r, label) => { if (r.status >= 200 && r.status < 300 && r.data) return r; console.error(`\nGagal pada: ${label}\nStatus: ${r.status}\nJawaban: ${JSON.stringify(r.json)}`); process.exit(1); };
const count = (rs, s) => rs.filter((r) => r.status === s).length;
const ok2xx = (r) => r.status >= 200 && r.status < 300;

const bad = await call("POST", "/auth/login", null, { email: AE, password: AP + "x" });
check("Login dengan password salah ditolak", bad.status === 400, `status ${bad.status}`);
const login = await call("POST", "/auth/login", null, { email: AE, password: AP });
const admin = typeof login.data === "string" ? login.data : null;
check("Login admin berhasil", login.status === 200 && typeof admin === "string", `status ${login.status}`);
if (!admin) { console.table(rows.map(([s, n, d]) => ({ status: s, pemeriksaan: n, detail: d }))); console.error("Login admin gagal. Periksa ADMIN_EMAIL dan ADMIN_PASSWORD: harus sama dengan SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD di .env, tanpa tanda kurung siku."); process.exit(1); }

const catU = need(await call("POST", "/categories", admin, { name: `${tag}-alat` }), "membuat kategori");
check("Buat kategori alat", ok2xx(catU), `${catU.status}`);
const pw = "Smoke-Pass-123";
const t1 = await call("POST", "/users", admin, { name: `${tag} t1`, email: `${tag}-t1@test.local`, password: pw, role: "technician" });
const t2 = await call("POST", "/users", admin, { name: `${tag} t2`, email: `${tag}-t2@test.local`, password: pw, role: "technician" });
check("Admin membuat dua akun teknisi", ok2xx(t1) && ok2xx(t2), `${t1.status}/${t2.status}`);
const tok1 = (await call("POST", "/auth/login", null, { email: `${tag}-t1@test.local`, password: pw })).data;
const tok2 = (await call("POST", "/auth/login", null, { email: `${tag}-t2@test.local`, password: pw })).data;
check("Teknisi bisa login", !!tok1 && !!tok2);

const e1 = await call("POST", "/equipment", admin, { serial: `${tag}-E1`, name: "OTDR uji", category: catU.data._id, condition: "good" });
const e2 = await call("POST", "/equipment", admin, { serial: `${tag}-E2`, name: "Alat rusak", category: catU.data._id, condition: "broken" });
check("Buat alat baik dan alat rusak", ok2xx(e1) && ok2xx(e2), `${e1.status}/${e2.status}`);

const broken = await call("POST", "/loans", admin, { equipment: e2.data._id, technician: t1.data._id });
check("Pinjam alat rusak ditolak (409)", broken.status === 409, `status ${broken.status}`);
const race = await Promise.all(Array.from({ length: 20 }, () => call("POST", "/loans", admin, { equipment: e1.data._id, technician: t1.data._id })));
check("20 permintaan pinjam bersamaan: tepat satu berhasil", count(race, 201) === 1 && count(race, 409) === 19, `201=${count(race, 201)} 409=${count(race, 409)}`);
const loan = race.find((r) => r.status === 201)?.data;

check("Teknisi tidak bisa mencatat pinjaman (403)", (await call("POST", "/loans", tok1, { equipment: e1.data._id, technician: t1.data._id })).status === 403);
check("Teknisi tidak bisa membuka daftar pengguna (403)", (await call("GET", "/users", tok1)).status === 403);
const mine1 = await call("GET", "/loans/mine", tok1), mine2 = await call("GET", "/loans/mine", tok2);
check("Teknisi 1 melihat pinjamannya, teknisi 2 tidak melihatnya", mine1.data?.length === 1 && mine2.data?.length === 0, `${mine1.data?.length}/${mine2.data?.length}`);

const ret = await Promise.all(Array.from({ length: 5 }, () => call("POST", `/loans/${loan.id ?? loan._id}/return`, admin, { returnCondition: "good" })));
check("5 permintaan kembali bersamaan: tepat satu berhasil", ret.filter(ok2xx).length === 1 && count(ret, 409) === 4, `ok=${ret.filter(ok2xx).length} 409=${count(ret, 409)}`);
const again = await call("POST", "/loans", admin, { equipment: e1.data._id, technician: t2.data._id });
check("Setelah dikembalikan baik, alat bisa dipinjam lagi", again.status === 201, `status ${again.status}`);

const e3 = await call("POST", "/equipment", admin, { serial: `${tag}-E3`, name: "OTDR scan", category: catU.data._id, condition: "good" });
check("Buat alat untuk uji scan", ok2xx(e3), `${e3.status}`);
const sc = encodeURIComponent(`${tag}-E3`);
check("Scan: admin hanya bisa melihat, tidak bisa pinjam (403)", (await call("GET", `/scan/${sc}`, admin)).data?.action === "view" && (await call("POST", `/scan/${sc}/borrow`, admin)).status === 403);
check("Scan: serial tidak dikenal (404)", (await call("GET", "/scan/TIDAK-ADA", tok1)).status === 404);
const sb = await Promise.all([tok1, tok2, tok1, tok2].map((t) => call("POST", `/scan/${sc}/borrow`, t)));
check("Scan: 4 teknisi memindai bersamaan, tepat satu berhasil", count(sb, 201) === 1 && count(sb, 409) === 3, `201=${count(sb, 201)} 409=${count(sb, 409)}`);
const winner = sb.findIndex((r) => r.status === 201) % 2 === 0 ? [tok1, tok2] : [tok2, tok1];
check("Scan: teknisi lain tidak bisa mengembalikan pinjaman orang lain (409)", (await call("POST", `/scan/${sc}/return`, winner[1], { returnCondition: "good" })).status === 409);
check("Scan: peminjam mengembalikan sendiri", ok2xx(await call("POST", `/scan/${sc}/return`, winner[0], { returnCondition: "good" })));
check("Scan: dikembalikan dua kali ditolak (409)", (await call("POST", `/scan/${sc}/return`, winner[0], { returnCondition: "good" })).status === 409);
const dupCat = await call("POST", "/categories", admin, { name: `${tag}-ALAT`.toUpperCase() });
check("Kategori dengan nama sama beda huruf besar/kecil ditolak (409)", dupCat.status === 409, `status ${dupCat.status}`);
const em2 = `${tag}-t2@test.local`;
const tries = [];
for (let i = 0; i < 5; i++) tries.push(await call("POST", "/auth/login", null, { email: em2, password: `salah-${i}` }));
check("Login salah 5 kali: 4 pertama ditolak (400), kelima dikunci (429)", count(tries, 400) === 4 && tries[4].status === 429, `400=${count(tries, 400)} terakhir=${tries[4].status}`);
const locked = await call("POST", "/auth/login", null, { email: em2, password: pw });
check("Saat terkunci, password yang benar pun ditolak (429)", locked.status === 429, `status ${locked.status}`);
const otherOk = await call("POST", "/auth/login", null, { email: `${tag}-t1@test.local`, password: pw });
check("Akun lain tidak ikut terkunci", otherOk.status === 200, `status ${otherOk.status}`);
check("Dashboard admin dan teknisi tersedia", (await call("GET", "/dashboard", admin)).status === 200 && (await call("GET", "/dashboard", tok1)).status === 200);

console.table(rows.map(([s, n, d]) => ({ status: s, pemeriksaan: n, detail: d })));
console.log(failed ? `${failed} GAGAL` : `Semua ${rows.length} pemeriksaan lulus`);
process.exit(failed ? 1 : 0);
