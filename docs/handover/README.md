# Panduan deploy dan serah terima

Kredensial tidak pernah ditaruh di repo atau chat. Deploy belum dijalankan; langkah di bawah dilakukan pemilik akun.

## 1. Yang perlu disiapkan
| Layanan | Untuk apa |
| --- | --- |
| MongoDB Atlas | database `db-inventori` (`DATABASE_URL`) |
| Vercel | hosting backend dan frontend |
| Cloudinary | hanya bila foto alat nanti dipakai (belum ada antarmukanya) |

Tidak perlu SMTP, Midtrans, atau layanan email: akun dibuat admin.

## 2. Environment variable
Backend (`be-inventori`): `DATABASE_URL`, `SECRET` (string acak panjang), `CLIENT_HOST` (URL frontend), `OVERDUE_DAYS` (default 7), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
Frontend (`fe-inventori`): `NEXT_PUBLIC_API_URL` (URL backend + `/api`).

## 3. Urutan
1. Buat cluster Atlas dan pengguna database, izinkan IP Vercel/0.0.0.0/0 sesuai kebijakan mitra.
2. Deploy backend, isi env, catat URL.
3. Jalankan `npm run seed:admin` sekali (dari mesin yang punya `DATABASE_URL`) untuk membuat admin pertama; ganti password awalnya setelah login.
4. Opsional: `npm run seed:catalog` menambah kategori dan aksesori awal (stok 0; isi lewat Stok masuk).
5. Deploy frontend dengan `NEXT_PUBLIC_API_URL` ke backend.
6. Isi `CLIENT_HOST` backend dengan URL frontend, deploy ulang backend.
7. Login sebagai admin, buat kategori, alat, stok, dan akun teknisi.
8. Jalankan skenario kosong di `docs/testing/blackbox-test-log.md` dan isi hasilnya.

## 4. Daftar serah terima ke mitra
- Source code kedua folder tanpa `.env`.
- Akun layanan atas nama mitra (atau pembuatan ulang), daftar env tanpa nilai rahasia.
- Panduan pemakaian admin dan teknisi, berita acara serah terima.
- Putar (rotate) semua kunci dan password awal setelah serah terima.
