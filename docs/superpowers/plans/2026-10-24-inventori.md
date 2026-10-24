# Platform Inventory Peralatan Teknisi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend `be-inventori` dan frontend `fe-inventori` untuk mencatat peminjaman alat ukur per unit dan stok perangkat/kabel per jumlah, dengan peran admin dan teknisi.

**Architecture:** Dua proyek terpisah. Backend Express+Mongoose; logika inti (pinjam/kembali/stok/dashboard) ada di `src/services/` di balik antarmuka penyimpanan sehingga diuji dengan tiruan; controller tipis. Frontend Next.js memanggil API langsung dengan JWT di cookie, kerangkanya diadaptasi dari `/home/claude/fe-acara`.

**Tech Stack:** Express 4, TypeScript, Mongoose, Yup, jsonwebtoken, Vitest; Next.js 16, React 19, Tailwind 4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-inventori-design.md`

## Global Constraints

- Peran hanya `admin` dan `technician`; akun dibuat admin; tidak ada email, registrasi mandiri, atau QR.
- Respons API: `{meta:{status,message}, data, pagination?}`. Kode: 400 validasi per field, 403 auth/peran (termasuk JWT tidak valid/kedaluwarsa), 404 tidak ada, 409 konflik (alat tidak tersedia, stok kurang, kembali ganda).
- Jumlah stok: bilangan bulat >= 1. `quantity` stok tidak pernah < 0.
- Payload dibangun dari daftar izin; klien tidak mengontrol `status`, `condition` saat pinjam, riwayat, atau `createdBy`.
- `loans` dan `stock_movements` hanya ditambah/ditutup, tidak ada endpoint ubah/hapus.
- Password: PBKDF2 dengan salt acak per pengguna. Ambang "lama dipinjam" 7 hari (konfigurasi `OVERDUE_DAYS`). Kalibrasi jatuh tempo: 30 hari ke depan atau terlewat.
- Port: backend 3000 (`/api`), frontend 3001. `NEXT_PUBLIC_API_URL` di frontend, `CLIENT_HOST` di backend.
- Tidak ada rahasia di repo; `.env.example` saja. Deploy tidak dijalankan.

## Review Focus

- Dua permintaan pinjam alat yang sama bersamaan: tepat satu berhasil (diuji lewat bentuk filter atomik).
- Pinjam alat berkondisi rusak/perbaikan atau berstatus dipinjam: 409.
- Kembali dua kali: kedua 409, alat tidak berubah dua kali.
- Stok keluar melebihi sisa: 409, stok tak berubah; jumlah 0, -1, 1.5, "abc": 400.
- Body berisi `status`, `role`, `quantity`, `createdBy`, `returnedAt` dari klien: diabaikan.
- Teknisi membaca pinjaman/riwayat teknisi lain: tidak ada (terfilter di server); teknisi mengakses endpoint admin: 403.
- Token kedaluwarsa/rusak: 403 (bukan 500). Akun nonaktif tidak bisa login.
- Alat dengan kategori terhapus atau kalibrasi kosong tidak merusak daftar/dashboard.
- Daftar kosong dan API tidak terjangkau: frontend menampilkan keadaan kosong/galat, bukan halaman putih.

---

### Task 1: Backend dasar, auth, pengguna

**Files:**
- Create: `/home/claude/be-inventori/` (package.json, tsconfig, vitest.config.ts, `.env.example`, `.gitignore`), `src/index.ts`, `src/utils/{env,response,jwt,password}.ts`, `src/middlewares/{auth,role}.ts`, `src/models/user.model.ts`, `src/controllers/{auth,user}.controller.ts`, `src/routes/api.ts`, `scripts/seed-admin.ts`
- Test: `tests/{password,auth-middleware,user-payload}.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): string` (format `salt:hash`), `verifyPassword(plain: string, stored: string): boolean`; `signToken(p: {id: string; role: Role}): string`, `verifyToken(t: string): {id; role}` (melempar bila rusak); middleware `authMiddleware` (403 pada token hilang/rusak/kedaluwarsa), `requireRole(...roles: Role[])`; `type Role = "admin" | "technician"`; `buildUserPayload(body: any)` -> `{name,email,password,role,isActive}` hanya field izin; rute `POST /api/auth/login`, `GET /api/auth/me`, admin CRUD `/api/users`.

- [ ] **Step 1: Tes gagal.** `password.test.ts`: dua hash dari password yang sama berbeda; `verifyPassword` benar/salah. `auth-middleware.test.ts`: token hilang, rusak, kedaluwarsa masing-masing -> 403 (bukan lempar); teknisi di `requireRole("admin")` -> 403. `user-payload.test.ts`: `buildUserPayload({role:"admin", isAdmin:true, _id:"x"})` hanya mengembalikan field izin.
- [ ] **Step 2: Jalankan** `npx vitest run` — Expected: FAIL (modul belum ada).
- [ ] **Step 3: Implementasi** semua signature di atas (PBKDF2 sha512, >=100000 iterasi, `timingSafeEqual`); login menolak akun `isActive=false` dengan 403; seed membuat admin dari env `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
- [ ] **Step 4: Jalankan** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: backend foundation, auth, users`.

### Task 2: Kategori, alat, item stok (CRUD)

**Files:**
- Create: `src/models/{category,equipment,stock-item}.model.ts`, `src/services/payloads.ts`, `src/controllers/{category,equipment,stock-item}.controller.ts`; modify `src/routes/api.ts`
- Test: `tests/payloads.test.ts`, `tests/schemas.test.ts`

**Interfaces:**
- Produces: `buildEquipmentPayload(body)`, `buildStockItemPayload(body)`, `buildCategoryPayload(body)` — allow-list; `equipment` default `status:"available"`, `condition:"good"` dan `status`/`quantity` tidak bisa diatur klien saat create/update kecuali `condition` (admin) dan, untuk stok, `quantity` awal saat create saja; Yup schema menolak serial/kode kosong, `minStock` < 0, `quantity` bukan bilangan bulat >= 0. Rute: admin CRUD `/api/categories`, `/api/equipment`, `/api/stock-items`; teknisi `GET` saja; daftar equipment mendukung filter `status`, `condition`, `search`, pagination.

- [ ] **Step 1: Tes gagal** — payload mengabaikan `status:"borrowed"`, `quantity` pada update stok, field asing; schema menolak `quantity: 1.5`, `-1`, serial kosong.
- [ ] **Step 2: Jalankan** `npx vitest run tests/payloads.test.ts tests/schemas.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementasi** model, schema, payload builder, controller, rute (populate kategori; kategori hilang tidak melempar).
- [ ] **Step 4: Jalankan** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: categories, equipment, stock items`.

### Task 3: Layanan peminjaman dan pengembalian

**Files:**
- Create: `src/services/loan-service.ts`, `src/services/equipment-store.ts`, `src/services/loan-store.ts`, `src/models/loan.model.ts`, `src/controllers/loan.controller.ts`; modify routes
- Test: `tests/loan-service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface EquipmentStore { markBorrowedIfAvailable(id: string): Promise<boolean>; markReturned(id: string, condition: "good"|"broken"|"repair"): Promise<void>; revertToAvailable(id: string): Promise<void> }
  interface LoanStore { create(l: {equipment: string; technician: string; recordedBy: string; note?: string}): Promise<LoanRecord>; closeIfOpen(loanId: string, returnCondition: Condition, note?: string): Promise<LoanRecord | null>; find(id: string): Promise<LoanRecord | null> }
  borrow(deps, input): Promise<{ok:true; loan} | {ok:false; code:409|404; message}>
  returnLoan(deps, loanId, returnCondition, note?): Promise<same>
  ```
  `markBorrowedIfAvailable` = `findOneAndUpdate({_id, status:"available", condition:"good"}, {status:"borrowed"})`. Rute admin: `POST /api/loans`, `POST /api/loans/:id/return`; `GET /api/loans` (admin semua, teknisi hanya `technician = req.user.id`), `GET /api/loans/mine`.
- [ ] **Step 1: Tes gagal** (tiruan in-memory): pinjam sukses; pinjam alat dipinjam -> 409; alat rusak -> 409; gagal membuat loan -> status dikembalikan; dua `borrow` bersamaan -> tepat satu ok; kembali baik -> alat tersedia; kembali rusak -> alat `broken`; kembali dua kali -> 409 dan alat tak berubah dua kali; teknisi tidak ada -> 404.
- [ ] **Step 2: Jalankan** `npx vitest run tests/loan-service.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementasi** service, store Mongo (filter atomik di atas), controller (payload dibangun server: `recordedBy` dari token, tanpa `returnedAt` dari klien), filter teknisi di server.
- [ ] **Step 4: Jalankan** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: borrow and return equipment`.

### Task 4: Layanan stok masuk/keluar

**Files:**
- Create: `src/services/stock-service.ts`, `src/services/stock-store.ts`, `src/models/stock-movement.model.ts`, `src/controllers/stock.controller.ts`; modify routes
- Test: `tests/stock-service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface StockStore { decrementIfEnough(id: string, n: number): Promise<boolean>; increment(id: string, n: number): Promise<void>; remaining(id: string): Promise<number|null>; addMovement(m: MovementInput): Promise<MovementRecord> }
  stockIn(deps, {itemId, quantity, recordedBy, note?}): Promise<Result>
  stockOut(deps, {itemId, quantity, technician, recordedBy, note?}): Promise<Result>
  ```
  `validateQuantity(q: unknown): number` melempar bila bukan bilangan bulat >= 1 (400). Rute admin: `POST /api/stock/in`, `POST /api/stock/out`; `GET /api/stock/movements` (admin semua; teknisi hanya `technician` miliknya).
- [ ] **Step 1: Tes gagal** — keluar sukses; melebihi sisa -> 409 dengan sisa di pesan, stok tak berubah; 0, -1, 1.5, "abc" -> 400; gagal catat movement -> stok dikembalikan; dua keluar bersamaan melebihi stok -> tepat satu; masuk menambah; movement hanya dibuat saat sukses.
- [ ] **Step 2: Jalankan** `npx vitest run tests/stock-service.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementasi** service dan store (`updateOne({_id, quantity:{$gte:n}}, {$inc:{quantity:-n}})`), controller, rute.
- [ ] **Step 4: Jalankan** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: stock in and out`.

### Task 5: Dashboard dan dokumentasi API

**Files:**
- Create: `src/services/dashboard-service.ts`, `src/controllers/dashboard.controller.ts`, `src/docs/swagger.ts`; modify routes; README backend
- Test: `tests/dashboard-service.test.ts`

**Interfaces:**
- Produces: `computeDashboard(data: {equipment: EquipmentLite[]; openLoans: LoanLite[]; stock: StockLite[]}, now: Date, cfg: {overdueDays: number; calibrationDays: number})` -> `{equipmentByStatus, equipmentByCondition, activeLoans, overdueLoans, calibrationDue, lowStock}`; `GET /api/dashboard` (admin: semua; teknisi: hanya pinjaman miliknya).
- [ ] **Step 1: Tes gagal** — pinjaman 8 hari terlambat, 6 hari tidak; kalibrasi kosong tidak dihitung dan tidak error; kalibrasi terlewat dan <=30 hari terhitung; stok `quantity <= minStock` terhitung; daftar kosong menghasilkan nol.
- [ ] **Step 2: Jalankan** `npx vitest run tests/dashboard-service.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementasi** fungsi murni + controller + Swagger ringkas untuk endpoint utama.
- [ ] **Step 4: Jalankan** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: dashboard and api docs`.

### Task 6: Frontend dasar, auth, penjaga rute

**Files:**
- Create: `/home/claude/fe-inventori/` dari scaffold Next.js; adaptasi dari `/home/claude/fe-acara`: `lib/{api,errors,auth,handle-error,format,validation,redirect,crud}.ts`, `hooks/useAsync.ts`, `components/{Button,Input,Toast,Modal,Skeleton,EmptyState,ErrorState,Pagination,SessionExpired,DataTable,ResourceForm,ResourceManager}.tsx`, `proxy.ts`, `app/layout.tsx`, `app/auth/login/page.tsx`, `components/{Header,AdminNav}.tsx`, `services/auth.ts`
- Test: `tests/{errors,api,auth,proxy,redirect}.test.ts`

**Interfaces:**
- Consumes: kontrak API Task 1 (login `{token}`; `GET /auth/me`; 403 = sesi).
- Produces: `proxy.ts` melindungi `/admin`, `/my`; admin di `/my` -> `/admin`, teknisi di `/admin` -> `/my`; tanpa/kedaluwarsa token -> `/auth/login?next=`. Role: `admin|technician`.
- [ ] **Step 1: Tes gagal** — adaptasi tes errors/api/auth/redirect (nama tetap), proxy: tanpa cookie, kedaluwarsa, teknisi ke /admin, admin ke /my.
- [ ] **Step 2: Jalankan** `npx vitest run` — Expected: FAIL.
- [ ] **Step 3: Implementasi** salin/adaptasi modul (ganti role `member` -> `technician`, hapus event/order), halaman login dengan navigasi keras dan `safeNext`.
- [ ] **Step 4: Jalankan** `npm test && npm run typecheck && npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: frontend foundation and auth`.

### Task 7: Frontend halaman admin (kategori, alat, stok, pengguna)

**Files:**
- Create: `services/{categories,equipment,stock-items,users}.ts`, `app/admin/{layout,page}.tsx`, `app/admin/{categories,equipment,stock,users}/page.tsx`
- Test: `tests/admin-crud.test.tsx`, `tests/equipment-list.test.tsx`

**Interfaces:**
- Consumes: `makeCrud`, `ResourceManager`, kontrak Task 2.
- Produces: tabel alat menampilkan status/kondisi/kalibrasi; kategori hilang tampil "-"; edit item stok tidak mengirim `quantity` (stok diubah lewat transaksi).
- [ ] **Step 1: Tes gagal** — daftar alat dengan kategori hilang dan kalibrasi kosong tidak error; keadaan kosong; galat + coba lagi; update stok tanpa `quantity` di body.
- [ ] **Step 2: Jalankan** `npx vitest run tests/admin-crud.test.tsx tests/equipment-list.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implementasi** services dan halaman.
- [ ] **Step 4: Jalankan** `npm test && npm run typecheck && npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: admin pages`.

### Task 8: Frontend transaksi, dashboard, halaman teknisi

**Files:**
- Create: `services/{loans,stock,dashboard}.ts`, `app/admin/{loans,movements}/page.tsx`, `components/{BorrowForm,ReturnDialog,StockOutForm}.tsx`, `app/my/{page,layout}.tsx`, `app/admin/page.tsx` (dashboard)
- Test: `tests/{borrow-form,stock-out-form,dashboard-page}.test.tsx`

**Interfaces:**
- Consumes: kontrak Task 3-5 (409 dengan pesan, `GET /loans/mine`, `GET /dashboard`).
- Produces: form tidak mengirim ganda (ref lock); 409 ditampilkan sebagai pesan konflik (bukan "kesalahan server"); jumlah divalidasi `validateQuantity` sebelum kirim; teknisi hanya melihat "Pinjaman saya".
- [ ] **Step 1: Tes gagal** — klik ganda -> satu panggilan; jumlah 0/-1/1.5 ditolak tanpa panggilan; 409 menampilkan pesan backend; dashboard kosong dan galat tampil benar.
- [ ] **Step 2: Jalankan** `npx vitest run` — Expected: FAIL.
- [ ] **Step 3: Implementasi.** Tambahkan penanganan 409 di `normalizeError` (`kind: "conflict"` membawa pesan).
- [ ] **Step 4: Jalankan** `npm test && npm run typecheck && npm run lint && npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: transactions, dashboard, technician view`.

### Task 9: Verifikasi, dokumentasi, serah terima

**Files:**
- Create: `fe-inventori/e2e/{stub-api,smoke}.mjs`, `docs/testing/blackbox-test-log.md`, `docs/handover/README.md`, README kedua repo, `docs/provenance.md` (di `/home/claude/inventori`)
- Test: uji alur browser dengan API tiruan

- [ ] **Step 1: Jalankan** build produksi dan `npm run e2e` melawan API tiruan (login admin, pinjam, kembali, stok keluar 409, teknisi tidak bisa ke /admin, API mati -> galat). Expected: semua lulus; catat hasil teramati saja.
- [ ] **Step 2: Tulis** log black-box (hanya hasil teramati; skenario butuh MongoDB asli dibiarkan kosong), panduan serah terima (env, deploy, seed admin; tidak dijalankan), provenance (kontribusi kelompok dan referensi materi kursus), README.
- [ ] **Step 3: Verifikasi akhir** kedua repo: `npm test && npx tsc --noEmit && npm run lint` (frontend juga `build`). Expected: PASS.
- [ ] **Step 4: Commit** `docs: testing log, handover, provenance`.
