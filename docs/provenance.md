# Asal kode dan kontribusi kelompok

## Ditulis kelompok (baru)
- `be-inventori`: seluruh model data, aturan peminjaman/pengembalian per unit, stok masuk/keluar atomik, dashboard, hak akses admin/teknisi, validasi, dan tes (96).
- `fe-inventori`: halaman login, dashboard, alat, stok, peminjaman, riwayat stok, pengguna, kategori, "pinjaman saya", form dengan penjaga klik ganda dan penanganan konflik, tes (89), uji browser; layar lihat-saja alat dan stok untuk teknisi.
- Dokumentasi: spec, rencana, log pengujian, panduan serah terima.
- Penamaan ulang menjadi "Rakit", logo (konsep rak dan stok), dan tampilan login baru dirancang dan ditulis dengan bantuan Claude (AI) atas arahan kelompok, lalu diuji dan ditinjau kelompok.

## Diadaptasi dari pekerjaan sebelumnya
- Kerangka frontend (`apiFetch`, penanganan error, komponen tabel/form/modal, penjaga rute) diadaptasi dari `fe-acara`, frontend platform tiket yang kelompok buat sebelumnya.
- Pola backend umum (struktur Express/Mongoose, JWT, format respons) mengacu pada backend `be-acara`, yang berasal dari materi kursus pihak lain (riwayat git: Muhammad Agung Rizkyana / wpucourse). Kode event, order, dan Midtrans dari sana tidak dibawa.

## Catatan untuk laporan
Sebutkan referensi di atas pada bagian metode dan batasan. Jangan mengklaim pola dasar autentikasi dan struktur proyek sebagai karya orisinal.
