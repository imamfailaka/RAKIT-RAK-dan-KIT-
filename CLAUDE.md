# CLAUDE.md — Rakit (Platform Inventory Peralatan Teknisi)

Platform inventory untuk monitoring peralatan teknisi pada PT. Supra Primatama Nusantara. Proyek Kerja Praktik kelompok 3 orang (pemilik akun: Emul).

## Aturan kerja
- **Selalu jawab dalam Bahasa Indonesia.**
- Jangan menaruh atau menampilkan password, `.env`, atau rahasia lain di chat dan repo. Pengguna login sendiri; jangan minta passwordnya.
- Jangan tambahkan trailer `Co-Authored-By`/atribusi Claude pada commit (permintaan pemilik).
- Jangan ubah kredit kode pihak ketiga di `docs/provenance.md` dan jangan menyembunyikan penggunaan AI.
- Pemilik sudah menyetujui penghapusan data lama (alat contoh, OTDR "BC DURPOL", seluruh stok) pada 24 Okt 2026; catatannya di `work/backup/catatan-sebelum-hapus.md`. Hapus data lain tetap tanya dulu.
- Data alat sekarang daftar nyata cabang Biznet Duri Pulo (`npm run seed:equipment`). Serial berawalan DEVISER-, FITEL-, INNOVIEW3-, TOGO-POWER-, OFI- adalah kode internal karena alatnya tidak bernomor seri; ganti lewat menu Alat bila nomor aslinya ada.
- Saat pemilik bilang sesi selesai: perbarui `CLAUDE.md`, `README.md`, dan `docs/` sebelum menutup.

## Struktur
- `be-inventori/` — Express + TypeScript + Mongoose (MongoDB Atlas, db `db-inventori`). Auth JWT 1 jam, password PBKDF2, validasi Yup, login dikunci 15 menit setelah 5 kali gagal.
- `fe-inventori/` — Next.js 16 (cacheComponents, guard di `proxy.ts`, cookie `inventori_token`), React 19, Tailwind 4, Sora, Phosphor icons.
- `docs/` — `superpowers/specs|plans` (desain, rencana), `testing/blackbox-test-log.md`, `handover/README.md` (deploy), `provenance.md` (asal kode).
- Peran: **Admin gudang** (kelola semua) dan **Teknisi** (lihat miliknya, daftar alat, pindai QR untuk pinjam/kembali). Akun dibuat admin; tidak ada daftar mandiri atau email. Tidak ada stok bahan/aksesori: Rakit hanya untuk peminjaman alat.

## Perintah
- Backend: `npm run dev`, `npm test` (86 tes), `npm run typecheck`, `npm run seed:admin | seed:catalog | seed:equipment`, `npm run smoke`.
- Frontend: `npm run dev` (port 3001), `npm test` (162 tes), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run e2e`.
- Kerjakan dengan TDD (vitest + Testing Library). Jalankan tes, typecheck, lint, dan build sebelum menyatakan selesai.

## Aturan domain
- Alat dilacak per unit (nomor seri). Tiga kategori: OTDR, Mesin Fusion Splicer, Lain-lain. Hanya alat `Tersedia` + kondisi `Baik` bisa dipinjam.
- QR dibuat per kategori (bukan per unit) di klien dari `/scan/c/<idKategori>`; halaman itu menampilkan semua unit. Unit dipinjam = tombol terkunci; hanya peminjam yang melihat tombol Kembalikan. Membuka halaman hanya GET (tidak mengubah data); pinjam/kembali lewat klik (POST `/scan/:serial/borrow|return`, hanya role teknisi, atas nama sendiri).
- Peminjaman dan pengembalian memakai filter atomik (status+kondisi, `returnedAt: null`); konflik = HTTP 409. Pinjaman milik teknisi lain dilaporkan 409 (bukan 403, karena 403 berarti sesi habis di FE).
- Pinjaman terlambat bila lebih dari 7 hari (`OVERDUE_DAYS`). Kalibrasi jatuh tempo dalam 30 hari.
- Di Vercel, `be-inventori/src/index.ts` harus membuat `express()` sendiri; `create-app.ts` berisi `mountApp`. Jangan buat `src/app.ts`.

## Aturan frontend
- Tema gelap "Malam". Pakai token Tailwind (`bg-canvas/rail/surface`, `text-ink/muted`, `accent`, `ok/warn/danger/info`), bukan warna mentah.
- Komponen server tidak boleh mengimpor `@phosphor-icons/react` langsung (error createContext); bungkus dengan komponen `"use client"` (contoh `Brand.tsx`).
- Nama perusahaan/aplikasi ("Rakit", pil RAK + KIT) hanya di `lib/brand.ts`. Logo: `LogoMark` (rak dan stok), nama dua warna: `Wordmark`; ikon tab `app/icon.svg`. Login memakai `LoginShell` + `LoginShowcase` (formulir lebih dulu di DOM; animasi `animate-rise` dengan `motion-reduce`). Navigasi admin bergrup (Ringkasan, Aset, Aktivitas, Administrasi); HP memakai bilah bawah.
- Daftar (`ResourceManager`) mendukung `searchable` dan `filters` (chip); API menerima `search`, `status`, `category`, `role`; `filters2` untuk baris chip kedua (kategori).

## Deploy (Vercel, tim `imam-cca4`)
- Web: https://inventori-web-gilt.vercel.app (project `inventori-web`, Root Directory `fe/fe-inventori`). API: https://inventori-api-six.vercel.app (project `inventori-api`, Root Directory `be/be-inventori`, docs `/api/docs`). Keduanya terhubung ke repo GitHub ini: push ke `main` = deploy production otomatis, branch/PR = preview.
- Deploy normal lewat `git push` (Git integration Vercel). Cadangan manual lewat MCP Vercel `create_deployment`. Verifikasi dengan `get_deployment` lalu `web_fetch_vercel_url` (curl sandbox ke vercel.app diblokir).
- Env backend: `DATABASE_URL`, `SECRET`, `CLIENT_HOST`, `OVERDUE_DAYS`. Env frontend: `NEXT_PUBLIC_API_URL` (tertanam saat build; ubah env = redeploy).
- Keamanan database dan serah terima kredensial: lihat `docs/handover/README.md`. Jangan pernah commit `.env`.

## Status (24 Okt 2026)
- Selesai: backend, frontend, katalog dan data contoh di Atlas, UI baru (sidebar bergrup, pencarian dan filter, dashboard interaktif), deploy, laporan online ("Laporan dan Panduan Penggunaan Web Inventori Teknisi"), jawaban pertanyaan tahap 2-8 (file Word).
- 24 Okt 2026: stok dihapus total (kode, DB, UI), kategori jadi 3, QR per kategori + halaman scan + lembar cetak (`/admin/categories/qr`), data Atlas diganti 14 alat Biznet Duri Pulo.
- 24 Okt 2026: menu teknisi "Pindai alat" kini punya kamera di aplikasi (`QrScanner`, jsqr) yang membuka halaman pinjam; menu admin "Kode QR" ke lembar cetak.
- Teknisi: setelah login masuk ke `/my/scan`; di HP bilah bawah berisi "Pindai alat" (kamera lalu pilih unit) dan "Pinjaman saya"; menu "Alat" hanya `desktopOnly`.
- Rebranding "Rakit" (logo, login dua kolom) selesai di kode dan lolos tes/typecheck/lint/build lokal; belum di-deploy sampai tampilan disetujui. Wilayah fungsi Vercel dipindah ke `sin1` (dekat Atlas Jakarta) agar login dan muat halaman cepat.
- Belum: deploy Rakit, pembaruan laporan online, UAT dengan mitra, serah terima akun hosting/DB ke mitra, berita acara, publikasi GitHub, artikel media dan jurnal.
