# Rakit — Platform Inventory Peralatan Teknisi

Dua proyek: `be-inventori` (API) dan `fe-inventori` (antarmuka). Lihat README masing-masing, `docs/superpowers/specs/` (desain), `docs/superpowers/plans/` (rencana), `docs/testing/` (log pengujian), `docs/handover/` (deploy), `docs/provenance.md` (asal kode).

Nama aplikasi di antarmuka adalah **Rakit** (RAK + KIT), diatur di `fe-inventori/lib/brand.ts`. Nama folder, URL Vercel, dan dokumen lama masih memakai "inventori".

## Perubahan 24 Okt 2026 (revisi alat saja + QR)
- Stok bahan/aksesori dihapus total; Rakit hanya untuk peminjaman alat. Dokumen spesifikasi, rencana, dan log uji lama masih menyebut stok sebagai riwayat; yang berlaku adalah `CLAUDE.md`.
- Tiga kategori (OTDR, Mesin Fusion Splicer, Lain-lain) dan satu QR per kategori. Scan membuka `/scan/c/<idKategori>`: unit tersedia punya tombol Pinjam, unit dipinjam terkunci, hanya peminjam yang bisa Kembalikan.
- Cetak QR: menu Kategori, tombol QR per baris, atau `/admin/categories/qr`.
- Data awal: `npm run seed:catalog` lalu `npm run seed:equipment` (daftar alat Biznet Duri Pulo di `be-inventori/src/data/sample-data.ts`).
- Koleksi lama `stockitems` dan `stockmovements` sudah dikosongkan di Atlas; modelnya dihapus dari kode.

## Struktur repo
- `be/be-inventori` — API Express + TypeScript + MongoDB (project Vercel `inventori-api`, Root Directory `be/be-inventori`).
- `fe/fe-inventori` — antarmuka Next.js (project Vercel `inventori-web`, Root Directory `fe/fe-inventori`).
- `docs/` — spesifikasi, rencana, log pengujian, panduan serah terima, asal kode.

## Menjalankan
Salin `be/be-inventori/.env.example` menjadi `.env` lalu isi sendiri nilainya (jangan di-commit). Backend: `npm install && npm run dev`. Frontend: `npm install && npm run dev` (port 3001). Data awal: `npm run seed:admin`, `seed:catalog`, `seed:equipment`.

## Keamanan
Repo ini publik. Rahasia (`DATABASE_URL`, `SECRET`, kredensial) hanya disimpan di Environment Variables Vercel dan file `.env` lokal yang diabaikan git.
