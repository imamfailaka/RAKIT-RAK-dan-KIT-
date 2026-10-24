# Log pengujian black-box — Platform Inventory Peralatan Teknisi

Kolom "Hasil aktual" hanya berisi yang benar-benar teramati. Skenario yang butuh backend + MongoDB asli belum dijalankan dan dibiarkan kosong untuk diisi pemilik akun.

Metode: **A** = tes otomatis backend (`be-inventori`, `npm test`, 96 tes, penyimpanan tiruan), **B** = tes otomatis frontend (`fe-inventori`, `npm test`, 89 tes), **C** = browser (Chromium) melawan API tiruan `fe-inventori/e2e/stub-api.mjs` (`npm run e2e`, 14 pemeriksaan), **D** = perlu backend + database asli, **G** = uji end-to-end ke MongoDB Atlas (`npm run smoke`), **H** = alur lengkap lewat browser di sandbox (FerretDB).

## Sudah teramati

| No | Fitur | Skenario | Diharapkan | Aktual | Status | Metode |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Auth | Tanpa token / token rusak / kedaluwarsa / kunci lain | 403, bukan 500 | 403 | Lulus | A |
| 2 | Auth | Teknisi memanggil rute admin | 403 | 403 | Lulus | A |
| 3 | Keamanan | Body berisi role/_id/field asing | Diabaikan | Hanya field izin | Lulus | A |
| 4 | Peminjaman | Pinjam alat tersedia dan baik | Berhasil, status dipinjam | Berhasil | Lulus | A |
| 5 | Peminjaman | Pinjam alat yang sudah dipinjam | 409 | 409 | Lulus | A, C |
| 6 | Peminjaman | Pinjam alat rusak | 409 | 409 | Lulus | A |
| 7 | Peminjaman | Dua permintaan bersamaan | Tepat satu berhasil | Satu berhasil (penyimpanan tiruan) | Lulus | A |
| 8 | Peminjaman | Gagal buat catatan loan | Status alat dikembalikan | Dikembalikan | Lulus | A |
| 9 | Pengembalian | Kembali baik / rusak | Alat tersedia / tidak bisa dipinjam lagi | Sesuai | Lulus | A, C |
| 10 | Pengembalian | Kembali dua kali | 409, alat tidak berubah dua kali | Sesuai | Lulus | A |
| 11 | Stok | Keluar melebihi sisa | 409 dengan sisa, stok tetap | Sesuai | Lulus | A |
| 12 | Stok | Jumlah 0, -1, 1.5, "abc", kosong | 400 / tombol nonaktif | Sesuai | Lulus | A, B |
| 13 | Stok | Dua keluar bersamaan melebihi stok | Tepat satu berhasil | Sesuai (penyimpanan tiruan) | Lulus | A |
| 14 | Stok | Gagal catat riwayat | Stok dikembalikan | Dikembalikan | Lulus | A |
| 15 | Dashboard | Kosong, kalibrasi kosong, status asing | Tanpa error | Sesuai | Lulus | A, B |
| 16 | Dashboard | Pinjaman 8 hari vs 6 hari | Terlambat vs tidak | Sesuai | Lulus | A |
| 17 | Frontend | Route guard: tanpa login, teknisi ke /admin, admin ke /my | Dialihkan | Sesuai | Lulus | B, C |
| 18 | Frontend | Login salah | Pesan di form, bukan error server | Tampil | Lulus | C |
| 19 | Frontend | Login lalu kembali ke tujuan (`next`) | Kembali ke halaman asal | Kembali | Lulus | C |
| 20 | Frontend | Klik ganda Pinjamkan / Keluarkan | Satu permintaan | Satu | Lulus | B |
| 21 | Frontend | 409 dari API | Pesan konflik, bukan "kesalahan server" | Tampil | Lulus | B, C |
| 22 | Frontend | Daftar alat dengan kategori hilang dan tanpa tanggal kalibrasi | "-" tanpa error | Sesuai | Lulus | B, C |
| 23 | Frontend | API mati | Pesan gagal + coba lagi | Tampil | Lulus | C |
| 24 | Auth | Akun dinonaktifkan / dihapus / diturunkan perannya setelah login | Token lama langsung ditolak / memakai peran terbaru | Sesuai (pencarian pengguna ditiru) | Lulus | A |
| 25 | Penyimpanan | Bentuk filter atomik: pinjam (status+kondisi), stok ($gte), tutup pinjaman (returnedAt null) | Filter persis seperti rancangan | Sesuai; tes gagal bila filter diubah | Lulus | A |
| 26 | Isolasi | Teknisi memberi ?technician= lain pada /loans, /stock/movements, /dashboard | Diabaikan, tetap miliknya | Sesuai; tes gagal bila filter dilonggarkan | Lulus | A |
| 27 | Frontend | Build produksi | Berhasil | Berhasil, 10 rute | Lulus | build |

## Belum dijalankan (butuh backend + MongoDB asli)

| No | Fitur | Skenario | Diharapkan | Aktual | Status |
| --- | --- | --- | --- | --- | --- |
| 28 | Seed | `npm run seed:admin` | Admin pertama dibuat | | |
| 29 | Login | Admin, teknisi, akun nonaktif | Token / 403 untuk nonaktif | | |
| 30 | Pengguna | Buat teknisi, email ganda | Dibuat / 409 | | |
| 31 | Alat | Serial ganda | 409 | | |
| 32 | Peminjaman | Dua admin meminjamkan alat yang sama bersamaan | Tepat satu berhasil | | |
| 33 | Stok | Dua stok keluar bersamaan melebihi sisa | Tepat satu berhasil, stok tidak minus | | |
| 34 | Riwayat | Teknisi A membaca pinjaman teknisi B | Tidak terlihat | | |
| 35 | Dashboard | Data nyata (terlambat, kalibrasi, stok menipis) | Sesuai data | | |

## Verifikasi filter atomik pada MongoDB asli (24 Okt 2026)

Dijalankan langsung pada MongoDB 8.0 (Atlas, cluster gratis) lewat konektor, pada database sementara yang sudah dihapus. Ini membuktikan perilaku filter di server database, **bukan** perilaku aplikasi end-to-end (metode **E**).

| No | Perintah | Diharapkan | Aktual | Status |
| --- | --- | --- | --- | --- |
| E1 | Pinjam unit `available` + `good` | 1 dokumen berubah | matched 1, modified 1 | Lulus |
| E2 | Pinjam unit `broken` dengan filter yang sama | 0 berubah | matched 0 | Lulus |
| E3 | Pinjam ulang unit yang sudah `borrowed` | 0 berubah | matched 0 | Lulus |
| E4 | Stok keluar 3 dari sisa 2 (`quantity >= 3`) | 0 berubah | matched 0, stok tetap 2 | Lulus |
| E5 | Stok keluar 2 dari sisa 2 | 1 berubah | matched 1, stok 0 | Lulus |
| E6 | Stok keluar 1 dari sisa 0 | 0 berubah, tidak minus | matched 0, stok 0 | Lulus |
| E7 | Tutup pinjaman `returnedAt: null` | 1 berubah | matched 1, modified 1 | Lulus |
| E8 | Tutup pinjaman yang sama lagi | 0 berubah | matched 0 | Lulus |

Permintaan benar-benar bersamaan (dua klien sekaligus) belum diuji; konektor mengirim perintah satu per satu.

## Uji API end-to-end lokal (24 Okt 2026), metode F

Backend sungguhan (`tsx src/index.ts`) dijalankan melawan **FerretDB 1.24 dengan SQLite** (pengganti kompatibel MongoDB, bukan MongoDB). Skrip: `be-inventori/scripts/api-smoke.mjs` (`npm run smoke`).

- Lulus, urutan satu per satu: login benar/salah, pembuatan kategori/alat/akun, pinjam alat rusak ditolak, hak akses teknisi (403), isolasi data teknisi, jumlah 0/negatif/desimal/teks ditolak, stok masuk, dashboard.
- **Tidak bisa dinilai pada FerretDB: semua pemeriksaan permintaan bersamaan.** Uji langsung dengan driver MongoDB tanpa kode aplikasi (15 `updateOne` `$inc` bersamaan dari stok 10) menghasilkan 15 "berhasil" dan stok akhir 4, jadi FerretDB-SQLite kehilangan pembaruan. Ini keterbatasan mesin pengganti, bukan bukti bug aplikasi. MongoDB asli menjamin pembaruan satu dokumen atomik.
- Temuan nyata dari uji ini: `npm run dev` dan skrip seed gagal karena `ts-node` tidak kompatibel dengan TypeScript 7. Sudah diganti dengan `tsx`.
- **Belum dijalankan:** `npm run smoke` terhadap MongoDB asli (Atlas). Jalankan dari komputer yang IP-nya diizinkan Atlas. Semua pemeriksaan bersamaan harus lulus di sana.

## Uji end-to-end terhadap MongoDB Atlas (24 Okt 2026), metode G

`npm run smoke` dijalankan pemilik akun dari komputernya: backend sungguhan (`tsx src/index.ts`) melawan cluster MongoDB Atlas (database `db-inventori`). Hasil: **23 dari 23 pemeriksaan lulus.**

| No | Skenario | Diharapkan | Aktual | Status |
| --- | --- | --- | --- | --- |
| G1 | Login dengan password salah | 400 | status 400 | Lulus |
| G2 | Login admin | 200 | status 200 | Lulus |
| G3 | Admin membuat kategori, dua akun teknisi, dua alat | 201 | 201 semua | Lulus |
| G4 | Pinjam alat rusak | 409 | status 409 | Lulus |
| G5 | 20 permintaan pinjam bersamaan untuk satu alat | Tepat satu 201 | 201=1, 409=19 | Lulus |
| G6 | Teknisi mencatat pinjaman / membuka daftar pengguna | 403 | 403 | Lulus |
| G7 | Isolasi pinjaman antar teknisi | Teknisi 1 melihat 1, teknisi 2 melihat 0 | 1 dan 0 | Lulus |
| G8 | 5 permintaan kembali bersamaan untuk satu pinjaman | Tepat satu berhasil | ok=1, 409=4 | Lulus |
| G9 | Alat dipinjam lagi setelah dikembalikan baik | 201 | status 201 | Lulus |
| G10 | 15 pengambilan bersamaan dari stok 10 | Tepat 10 berhasil | ok=10, 409=5 | Lulus |
| G11 | Stok akhir | 0, tidak minus | quantity=0 | Lulus |
| G12 | Jumlah 0, -1, 1.5, "abc" | 400 | 400 semua | Lulus |
| G13 | Stok masuk 5 | 201 | status 201 | Lulus |
| G14 | Isolasi riwayat stok antar teknisi | Teknisi 1 melihat 10, teknisi 2 melihat 0 | 10 dan 0 | Lulus |
| G15 | Dashboard admin dan teknisi | 200 | 200 | Lulus |

Catatan: skrip membuat data berawalan `smoke-` yang tetap ada di database. Pengujian lewat antarmuka oleh pengguna (UAT) belum dilakukan.

## Uji alur lengkap lewat browser (24 Okt 2026), metode H

Dijalankan di sandbox: Chromium (Playwright) menjalankan alur admin dan teknisi di frontend sungguhan (`next dev`) yang terhubung ke backend sungguhan. Database sandbox adalah **FerretDB (SQLite), bukan MongoDB asli**, jadi bagian ini membuktikan alur layar, validasi, dan hak akses, bukan konkurensi (konkurensi dibuktikan di bagian G pada Atlas). Skrip: `docs/testing/e2e-sandbox/run.js`, hasil mentah: `hasil.json`. Hasil: **26 dari 26 lulus**, dijalankan pada database kosong.

| No | Skenario | Diharapkan | Aktual | Status |
| --- | --- | --- | --- | --- |
| H1 | Login password salah | Pesan error, tetap di halaman login | Sesuai | Lulus |
| H2 | Login admin | Masuk dashboard admin | Sesuai | Lulus |
| H3 | Tambah kategori | Tampil di daftar | Sesuai | Lulus |
| H4 | Kategori sama beda huruf besar/kecil | Ditolak | Ditolak, modal tetap terbuka | Lulus |
| H5 | Tambah alat OTDR | Tampil, status Tersedia | Sesuai | Lulus |
| H6 | Serial alat sama | Ditolak | Ditolak ("serial exists") | Lulus |
| H7 | Buat akun teknisi | Tampil di daftar pengguna | Sesuai | Lulus |
| H8 | Email teknisi sama | Ditolak | Ditolak ("email already used") | Lulus |
| H9 | Pinjamkan OTDR ke teknisi | Tercatat, belum dikembalikan | Sesuai | Lulus |
| H10 | Pinjam alat yang sedang dipinjam | Tidak tersedia di pilihan | Pilihan kosong | Lulus |
| H11 | Kembalikan kondisi baik | Tercatat "(Baik)" | Sesuai | Lulus |
| H12 | Status alat setelah kembali | Tersedia | Sesuai | Lulus |
| H13 | Item stok dengan stok awal 20 | Sisa 20 | Sesuai | Lulus |
| H14 | Stok awal di riwayat | Muncul sebagai Masuk 20 | Sesuai | Lulus |
| H15 | Stok masuk 5 | Sisa 25 | Sesuai | Lulus |
| H16 | Stok keluar 10 ke teknisi | Sisa 15 | Sesuai | Lulus |
| H17 | Stok keluar 5000 | Form menolak, stok tetap 15 | "Jumlah melebihi sisa stok (15)", tombol nonaktif | Lulus |
| H18 | Jumlah 0 dan -3 | Tombol nonaktif | Nonaktif | Lulus |
| H19 | Dashboard admin | Data sesuai | Sesuai | Lulus |
| H20 | Logout, login teknisi | Masuk halaman teknisi | Sesuai | Lulus |
| H21 | Menu teknisi | Hanya Pinjaman saya, Alat, Stok | Sesuai | Lulus |
| H22 | Data milik teknisi | Pinjaman dan pengambilan stok sendiri tampil | Sesuai | Lulus |
| H23 | Halaman Alat dan Stok teknisi | Tanpa tombol Tambah/Ubah/Hapus | 0 tombol aksi | Lulus |
| H24 | Teknisi membuka /admin | Diarahkan keluar | Diarahkan ke /my | Lulus |

Temuan yang diperbaiki dari pengujian ini: stok awal tidak masuk riwayat (kini dicatat sebagai "Masuk", 7 tes unit) dan kategori kembar beda huruf besar/kecil lolos pada FerretDB (kini dicek di aplikasi, 4 tes unit; indeks unik tanpa membedakan huruf tetap ada untuk MongoDB).

Temuan yang belum diperbaiki (minor): pesan error dari backend tampil dalam bahasa Inggris di notifikasi ("serial exists", "email already used"), sementara antarmuka berbahasa Indonesia.
