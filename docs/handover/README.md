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

## Monitoring lokasi teknisi (peta, gratis)

Posisi alat di lapangan dilacak lewat GPS HP teknisi, tanpa biaya: lokasi dibaca dengan Geolocation API bawaan browser dan ditampilkan di peta OpenStreetMap (Leaflet). Tidak perlu API key, kartu kredit, atau aplikasi tambahan.

Kapan lokasi tercatat:
- **Pinjam dan kembali lewat scan QR**: GPS wajib. Bila lokasi mati atau izin ditolak, tombol Pinjam/Kembalikan tidak diproses dan teknisi mendapat petunjuk cara mengaktifkannya. Server juga menolak (`400 lokasi wajib diaktifkan`) bila lokasi tidak dikirim.
- **Check-in**: di halaman teknisi (`/my`) ada kartu "Lokasi saya" dengan tombol **Kirim lokasi saya**. Bila izin lokasi sudah pernah diberikan, posisi terkirim otomatis setiap aplikasi dibuka (maksimal 1x per 30 menit). Kartu berwarna kuning bila hari itu belum ada kiriman.
- Pinjam/kembali yang dicatat admin dari menu Peminjaman tidak membawa lokasi.

Admin melihat semuanya di menu **Peta teknisi** (`/admin/locations`): titik besar = posisi terakhir tiap teknisi (hijau aktif, abu-abu lebih dari `LOCATION_STALE_HOURS` jam tidak update, bawaan 4), titik kecil = riwayat. Tombol "Lihat jejak" menampilkan riwayat satu teknisi. Riwayat lokasi dihapus otomatis setelah 90 hari (index TTL di koleksi `locationlogs`).

Batasan web: browser tidak bisa melacak di latar belakang, jadi untuk tracking terus-menerus di lapangan dipakai aplikasi gratis **Traccar Client** (lihat bawah).

### Tracking otomatis di lapangan (Traccar Client, gratis)

Aplikasi open-source Traccar Client (Android/iOS) mengirim GPS tiap beberapa menit walau HP terkunci. Datanya langsung masuk ke backend ini (`POST/GET /api/traccar`), tidak perlu server Traccar, tidak ada biaya. Titiknya tampil di Peta teknisi sebagai event "Otomatis"; "Lihat jejak" menggambar garis rute teknisi.

Pemasangan oleh teknisi (halaman `/my`, kartu "Tracking otomatis"):
1. Tekan **Buat ID perangkat saya** (ID acak `trk_...`, rahasia, berfungsi sebagai kunci).
2. Pasang Traccar Client, isi **Server URL** = `<NEXT_PUBLIC_API_URL>/traccar` (mis. `https://inventori-api.vercel.app/api/traccar`) dan **Device identifier** = ID tadi (tombol Salin tersedia).
3. Frequency 300 detik, Location accuracy High, izin lokasi "Selalu", matikan penghemat baterai untuk aplikasi ini.
4. Tekan Start saat mulai kerja, Stop setelah jam kerja.

Keamanan: hanya ID milik teknisi aktif yang diterima (akun nonaktif otomatis ditolak). Bila HP hilang/ganti HP, teknisi menekan **Buat ID baru**; ID lama langsung tidak berlaku. Titik yang tertahan saat offline diterima sampai 7 hari ke belakang.

Privasi (UU PDP): beri tahu teknisi secara tertulis bahwa lokasi dipantau, untuk keperluan apa, dan hanya selama jam kerja (Start/Stop). Riwayat dihapus otomatis setelah 90 hari.

Tips agar teknisi rutin membuka HP (dan lokasi ikut terkirim):
1. **Jadikan aturan kerja**: setiap ambil/kembalikan alat wajib lewat scan QR, bukan dicatat admin. Karena scan wajib GPS, lokasi otomatis tercatat.
2. **Check-in di awal tugas dan saat tiba di lokasi pelanggan/site** sebagai bagian SOP harian.
3. **Pasang web ke layar utama HP** (Chrome: menu ⋮ → Tambahkan ke layar utama; Safari: Bagikan → Tambah ke Layar Utama) supaya sekali ketuk terbuka dan lokasi terkirim otomatis.
4. **Izinkan lokasi "Selalu untuk situs ini"** sekali saja saat pertama dipakai, supaya tidak ada pop-up lagi dan check-in otomatis berjalan.
5. **Pantau tiap hari dari Peta teknisi**: teknisi berstatus abu-abu ("Lama tidak update") diingatkan lewat grup Telegram.
6. **Wajibkan Traccar Client menyala (Start) selama jam kerja** dan cek di peta: titik abu-abu berarti aplikasi mati atau HP tanpa sinyal.
7. **Pengingat terjadwal di grup Telegram** (mis. jam 08.00 dan 13.00: "Silakan kirim lokasi") bisa dibuat dari fitur pesan terjadwal Telegram tanpa biaya.

Env baru (opsional) di backend: `LOCATION_STALE_HOURS` (bawaan 4).
