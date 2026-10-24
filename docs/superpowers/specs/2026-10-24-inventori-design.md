# Platform Inventory Monitoring Peralatan Teknisi — Desain

Mitra: PT. Supra Primatama Nusantara (diduga badan hukum Biznet Networks; **belum dikonfirmasi** — cek ke mitra).
Tugas: Kerja Praktik kelompok (3 orang). Metode pengembangan: Waterfall.

## 1. Tujuan dan keberhasilan

Admin gudang mencatat peminjaman alat ukur per unit dan pengeluaran perangkat/kabel per jumlah kepada teknisi, sehingga selalu jelas siapa membawa apa, apa kondisinya, kapan kalibrasinya, dan berapa sisa stok.

Berhasil bila: (a) alat yang sama tidak bisa dipinjamkan ganda, (b) stok tidak pernah minus, (c) riwayat tidak bisa diubah, (d) dashboard menampilkan pinjaman aktif/terlambat, kalibrasi jatuh tempo, dan stok di bawah minimum, (e) logika inti punya tes otomatis.

## 2. Asumsi (belum dikonfirmasi mitra)

- Dua kelompok barang: **alat ukur/sambung** (OTDR, power meter, splicer, cleaver) dilacak per unit; **perangkat/kabel** (ONT, router, dropcore, konektor) dilacak per jumlah stok.
- Admin gudang mencatat semua transaksi; teknisi hanya melihat. Tanpa pengajuan/persetujuan.
- Satu alat dipinjam satu teknisi dalam satu waktu. Ambang "lama dipinjam" = 7 hari (konfigurasi).

## 3. Arsitektur

Dua proyek terpisah: `be-inventori` (Express 4, TypeScript, Mongoose/MongoDB, JWT, Yup, Cloudinary untuk foto, Swagger) dan `fe-inventori` (Next.js App Router, React, TypeScript, Tailwind; token JWT di cookie, memanggil API langsung). Logika inti di `src/services/` tanpa ketergantungan Express, dengan antarmuka penyimpanan agar bisa diuji dengan tiruan.

## 4. Model data

- `users`: nama, email (hanya sebagai nama pengguna login, tidak ada pengiriman email), password (hash PBKDF2 dengan salt per pengguna), `role` admin|technician, `isActive`. Akun dibuat admin (tanpa registrasi mandiri dan tanpa aktivasi email); admin mengatur password awal dan dapat menonaktifkan akun. Akun admin pertama dibuat lewat skrip seed.
- `categories`: nama, `kind` unit|stock.
- `equipment` (unit): serial (unik), nama, kategori, lokasi, `condition` good|broken|repair, `status` available|borrowed, `lastCalibration`, `nextCalibration`, foto.
- `stock_items`: kode (unik), nama, kategori, satuan, `quantity` (>=0), `minStock`.
- `loans`: equipment, technician, recordedBy, borrowedAt, returnedAt?, returnCondition?, note. Hanya ditambah/ditutup, tidak dihapus.
- `stock_movements`: item, type in|out, quantity (>=1), technician? (wajib untuk out), recordedBy, createdAt, note. Hanya ditambah.

## 5. Aturan dan alur

- Pinjam: update atomik `equipment {_id, status:available, condition:good} -> borrowed`; gagal = 409. Lalu buat `loans`; jika gagal, status dikembalikan.
- Kembali: tutup `loans` yang `returnedAt` kosong secara atomik; alat jadi `available` bila kondisi good, atau `broken` bila rusak. Pengembalian ganda ditolak 409.
- Stok keluar: `updateOne({_id, quantity:{$gte:n}}, {$inc:{quantity:-n}})`; 0 hasil = 409 dengan sisa stok. Lalu catat movement; jika gagal, stok dikembalikan.
- Stok masuk: `$inc` positif + movement.
- Jumlah harus bilangan bulat >= 1.
- Input dibangun dari daftar izin; klien tidak mengontrol status/riwayat.

## 6. Peran dan hak akses

Admin: semua CRUD (pengguna, kategori, alat, item stok) dan semua transaksi. Teknisi: lihat alat dan stok, lihat hanya riwayat/pinjaman miliknya, dashboard ringkas. Middleware: token tidak valid/kedaluwarsa dan peran tidak cukup = 403.

## 7. Dashboard

Admin: jumlah alat per status/kondisi, pinjaman aktif dan yang melewati ambang, kalibrasi jatuh tempo dalam 30 hari atau terlewat, stok <= minStock. Teknisi: pinjaman aktifnya.

## 8. Antarmuka (frontend)

Halaman: login, dashboard, alat, stok, peminjaman, pengguna, kategori (admin), "pinjaman saya" (teknisi). Setiap halaman punya keadaan loading, kosong, dan galat dengan tombol coba lagi. Rute dijaga `proxy.ts` berdasarkan cookie dan peran; admin tidak dipaksa ke rute teknisi dan sebaliknya.

## 9. Error

Format respons `{meta:{status,message}, data, pagination?}`. 400 validasi per field, 403 auth/peran, 404 tidak ada, 409 konflik (alat tidak tersedia, stok kurang, kembali ganda). Error tak terduga 500 tanpa membocorkan detail.

## 10. Pengujian (Review Focus)

Unit/servis dengan penyimpanan tiruan: pinjam alat yang sedang dipinjam; pinjam alat rusak; kembali dua kali; stok kurang; jumlah 0/negatif/desimal; dua permintaan bersamaan (bentuk perintah atomik); payload dengan `status`/`quantity` dari klien diabaikan; teknisi tidak bisa membaca riwayat teknisi lain; token kedaluwarsa. Frontend: proxy, kondisi kosong/galat, uji alur browser dengan API tiruan. MongoDB asli tidak tersedia di sandbox sehingga atomisitas nyata diuji pemilik akun dan dicatat di log black-box.

## 11. Kontribusi kelompok dan referensi

`be-inventori` dan `fe-inventori` adalah kode baru yang ditulis kelompok: seluruh model data, aturan peminjaman dan stok, hak akses, dashboard, tes otomatis, dokumentasi, dan antarmuka. Pola teknis umum (struktur Express/Mongoose, autentikasi JWT, format respons) mengacu pada materi kursus yang menjadi dasar backend `be-acara` sebelumnya, yang ditulis pihak lain (Muhammad Agung Rizkyana/wpucourse); referensi ini disebut di laporan pada bagian metode dan batasan.

## 12. Di luar lingkup

Pengajuan/persetujuan bertingkat, pengiriman email (aktivasi, notifikasi), QR/barcode, registrasi mandiri, ekspor laporan, integrasi dengan sistem Biznet, deploy dilakukan pemilik akun.
