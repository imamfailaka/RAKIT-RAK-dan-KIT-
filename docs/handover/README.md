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
Backend (`be-inventori`): `DATABASE_URL`, `SECRET` (string acak panjang), `CLIENT_HOST` (URL frontend), `OVERDUE_DAYS` (default 7), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`. Opsional untuk bot Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`.
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


## Bot Telegram (pemantauan pinjam dan riwayat)

Bot mengirim pesan otomatis ke satu grup tiap ada peminjaman dan pengembalian (jadi riwayat di grup) dan membalas perintah `/dipinjam` (siapa memegang alat apa, lama hari, penanda terlambat) dan `/riwayat [jumlah]` (bawaan 10, maksimal 30). Chat lain selain grup yang diizinkan diabaikan.

Pemasangan (dilakukan pemilik, token jangan dikirim lewat chat atau disimpan di repo):
1. Di Telegram, buka @BotFather, kirim `/newbot`, ikuti langkahnya, simpan token bot.
2. Buat grup, masukkan bot dan atasan/admin. Kirim satu pesan di grup, lalu ambil chat id grup (angka negatif, mis. `-100123...`), misalnya dengan menambahkan bot @RawDataBot sementara atau membuka `https://api.telegram.org/bot<TOKEN>/getUpdates` di peramban.
3. Di Vercel, project `inventori-api` > Settings > Environment Variables, isi `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan `TELEGRAM_WEBHOOK_SECRET` (string acak panjang buatan sendiri), lalu redeploy.
4. Buka sekali di peramban: `https://<alamat-api>/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>`. Jawaban 200 berarti webhook terdaftar.
5. Di grup, matikan Privacy Mode bot lewat BotFather (`/setprivacy` > Disable) bila perintah tanpa garis miring tidak dipakai; perintah `/dipinjam` tetap bekerja pada mode bawaan.

Notifikasi bersifat best effort: bila Telegram tidak terjangkau, pinjam/kembali tetap berhasil dan tersimpan.
