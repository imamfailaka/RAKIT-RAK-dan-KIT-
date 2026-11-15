const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, TableOfContents, PageBreak, Footer, PageNumber,
} = require("docx");

const OUT = process.argv[2];
const FONT = "Arial";
const GREEN = "1F8F6A";
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - 2 * MARGIN; // A4, 2 cm margin

let instance = 0;
const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
/** Teks dengan **tebal** sederhana. */
const rich = (s, o = {}) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((p) => (p.startsWith("**") ? t(p.slice(2, -2), { ...o, bold: true }) : t(p, o)));
const p = (s, o = {}) => new Paragraph({ children: rich(s), spacing: { after: 120 }, ...o });
const h1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)] });
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)] });
const h3 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [t(s)] });
const bullets = (items) => items.map((s) => new Paragraph({ numbering: { reference: "bul", level: 0 }, children: rich(s), spacing: { after: 60 } }));
const steps = (items) => {
  const inst = ++instance;
  return items.map((s) => new Paragraph({ numbering: { reference: "num", level: 0, instance: inst }, children: rich(s), spacing: { after: 60 } }));
};
const note = (label, s, fill = "E8F5EF", bar = GREEN) =>
  new Paragraph({
    children: [t(label + " ", { bold: true, color: bar }), ...rich(s)],
    shading: { type: ShadingType.CLEAR, fill, color: "auto" },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: bar, space: 8 } },
    spacing: { before: 120, after: 160 },
    indent: { left: 160, right: 160 },
  });
const tip = (s) => note("Tips:", s);
const warn = (s) => note("Penting:", s, "FDF3E1", "B7791F");

const border = { style: BorderStyle.SINGLE, size: 4, color: "C9D3CE" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, ratios) {
  const total = ratios.reduce((a, b) => a + b, 0);
  const widths = ratios.map((r) => Math.floor((CONTENT_W * r) / total));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const cell = (s, i, head) =>
    new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders,
      shading: head ? { type: ShadingType.CLEAR, fill: GREEN, color: "auto" } : undefined,
      margins: { top: 80, bottom: 80, left: 110, right: 110 },
      children: [new Paragraph({ children: rich(s, head ? { bold: true, color: "FFFFFF" } : {}) })],
    });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const URL = "https://rakitbiz.vercel.app";

const body = [
  // ===== Sampul =====
  new Paragraph({ children: [], spacing: { before: 2600 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("RAKIT", { bold: true, size: 72, color: GREEN })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [t("Rak dan Kit: Inventori Alat Teknisi", { size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [t("Panduan Penggunaan Setiap Fitur", { bold: true, size: 40 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("PT Supra Primatama Nusantara", { size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`Alamat aplikasi: ${URL}`, { size: 22, color: "555555" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Versi November 2026", { size: 22, color: "555555" })] }),
  pageBreak(),

  // ===== Daftar isi =====
  new Paragraph({ children: [t("Daftar Isi", { bold: true, size: 32 })], spacing: { after: 200 } }),
  new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-2" }),
  pageBreak(),

  // ===== 1 =====
  h1("1. Mengenal RAKIT"),
  p("RAKIT adalah aplikasi web untuk mencatat alat kerja teknisi (OTDR, fusion splicer, dan lainnya): siapa yang sedang memegang alat, sejak kapan, di mana posisinya, serta kondisi dan jadwal kalibrasinya. Aplikasi dibuka lewat peramban (Chrome atau Safari) di HP maupun komputer. Tidak perlu memasang aplikasi."),
  p(`Alamat aplikasi: **${URL}**`),
  h2("1.1 Tiga peran pengguna"),
  p("Akun hanya dibuat oleh admin. Tidak ada pendaftaran mandiri. Setiap akun punya satu peran:"),
  table(
    ["Fitur", "Admin", "Manager", "Teknisi"],
    [
      ["Dashboard ringkasan", "Ya", "Ya", "Hanya pinjaman sendiri"],
      ["Lihat alat, kategori, peminjaman", "Ya", "Ya (lihat saja)", "Alat dan pinjaman sendiri"],
      ["Tambah/ubah alat dan kategori, cetak QR", "Ya", "Tidak", "Tidak"],
      ["Catat pinjam/kembali manual", "Ya", "Tidak", "Tidak"],
      ["Pinjam/kembali lewat scan QR", "Tidak", "Tidak", "Ya"],
      ["Peta teknisi dan jejak lokasi", "Ya", "Ya", "Tidak"],
      ["Kelola akun pengguna", "Ya", "Lihat daftar saja", "Tidak"],
      ["Audit (riwayat aktivitas)", "Ya", "Ya", "Tidak"],
      ["Perintah bot Telegram", "Ya", "Ya", "Tidak"],
    ],
    [40, 17, 20, 23]
  ),
  gap(),

  // ===== 2 =====
  h1("2. Masuk dan Keluar"),
  h2("2.1 Masuk (login)"),
  ...steps([
    `Buka **${URL}** di peramban.`,
    "Isi **Email** dan **Password** yang diberikan admin. Tekan ikon mata untuk melihat password yang diketik.",
    "Tekan **Masuk**. Admin dan manager masuk ke Dashboard, teknisi masuk ke halaman Pindai alat.",
  ]),
  h2("2.2 Pesan yang mungkin muncul"),
  table(
    ["Pesan", "Arti dan tindakan"],
    [
      ["Email atau password salah", "Periksa ejaan email/password. Lupa password? Minta admin mengisi password baru."],
      ["Akun tidak aktif. Hubungi admin gudang.", "Akun sedang dinonaktifkan. Hubungi admin."],
      ["Terlalu banyak percobaan login", "Terlalu sering salah password. Tunggu sesuai menit yang tertera, lalu coba lagi."],
      ["Sesi berakhir, silakan login lagi", "Sesi berlaku 1 jam. Masuk ulang; Anda dikembalikan ke halaman sebelumnya."],
    ],
    [35, 65]
  ),
  h2("2.3 Keluar (logout)"),
  p("Tekan **Keluar** di pojok kanan atas. Di halaman scan QR juga ada tulisan **Masuk sebagai <nama>** dan tombol **Bukan Anda? Keluar**. Selalu periksa nama ini sebelum meminjam, terutama bila HP dipakai bergantian."),
  warn("Bila HP dipakai lebih dari satu orang, selalu tekan Keluar setelah selesai. Alat yang dipinjam akan tercatat atas nama akun yang sedang masuk."),
  pageBreak(),

  // ===== 3 Teknisi =====
  h1("3. Panduan Teknisi"),
  p("Menu teknisi: **Pinjaman saya**, **Pindai alat**, **Sedang dipinjam**, dan **Alat** (khusus layar komputer)."),
  h2("3.1 Persiapan sekali di awal"),
  ...steps([
    "Pastikan **GPS (Lokasi)** HP menyala. Pinjam dan kembali alat tidak bisa diproses tanpa lokasi.",
    "Saat pertama kali peramban meminta izin **Lokasi** dan **Kamera**, pilih **Izinkan**.",
    "Pasang aplikasi ke layar utama agar sekali ketuk terbuka. Chrome: menu ⋮ lalu **Tambahkan ke layar utama**. Safari: **Bagikan** lalu **Tambah ke Layar Utama**.",
  ]),
  h2("3.2 Meminjam alat (scan QR)"),
  p("Setiap kategori alat punya stiker QR. Ada dua cara memindai:"),
  ...bullets([
    "**Dari aplikasi:** buka menu **Pindai alat**, arahkan kamera ke QR kategori.",
    "**Dari kamera HP:** pindai QR dengan kamera bawaan HP, lalu ketuk tautannya.",
  ]),
  p("Langkah meminjam:"),
  ...steps([
    "Pindai QR kategori. Muncul daftar unit dalam kategori itu beserta statusnya.",
    "Periksa tulisan **Masuk sebagai <nama Anda>** di bagian atas.",
    "Pada unit berstatus **Tersedia** dan kondisi **Baik**, tekan **Pinjam**.",
    "Tunggu tulisan **Memproses...** selesai. Status unit berubah menjadi **Dipinjam oleh Anda**.",
  ]),
  p("Arti tampilan unit:"),
  table(
    ["Tampilan", "Arti"],
    [
      ["Tersedia + tombol Pinjam", "Boleh dipinjam."],
      ["Sedang dipinjam (tombol abu-abu)", "Dipegang teknisi lain; tertulis nama peminjamnya. Tidak bisa diklik."],
      ["Kondisi Rusak / Perbaikan", "Tidak bisa dipinjam sampai admin mengubah kondisinya."],
      ["Dipinjam oleh Anda + Konfirmasi kembalikan", "Unit milik Anda; bisa dikembalikan."],
    ],
    [40, 60]
  ),
  tip("Bila muncul pesan lokasi tidak bisa dibaca, nyalakan GPS, izinkan lokasi untuk situs ini, lalu tekan Pinjam lagi."),
  h2("3.3 Mengembalikan alat"),
  ...steps([
    "Pindai QR kategori alat yang dikembalikan.",
    "Pada unit bertanda **Dipinjam oleh Anda**, pilih **Kondisi saat dikembalikan**: Baik, Rusak, atau Perbaikan.",
    "Tekan **Konfirmasi kembalikan**. Muncul pesan hijau \"... dikembalikan.\"",
  ]),
  warn("Isi kondisi dengan jujur. Unit yang dikembalikan Rusak atau Perbaikan otomatis tidak bisa dipinjam orang lain sampai diperbaiki."),
  h2("3.4 Pinjaman saya"),
  p("Halaman awal teknisi. Berisi alat yang sedang Anda pegang dan riwayat pinjaman Anda. Di halaman ini juga ada kartu **Lokasi saya** dan **Tracking otomatis** (lihat 3.7 dan 3.8)."),
  h2("3.5 Sedang dipinjam"),
  p("Daftar semua alat yang sedang dibawa teknisi mana pun: nama alat, serial, peminjam, sejak tanggal berapa, dan sudah berapa hari. Gunakan untuk mencari siapa yang memegang alat yang Anda butuhkan, lalu hubungi orangnya."),
  h2("3.6 Alat"),
  p("Daftar seluruh alat beserta status, kondisi, dan jadwal kalibrasi. Hanya untuk dilihat. Menu ini tampil di layar komputer."),
  h2("3.7 Lokasi saya (check-in)"),
  p("Kartu ini hanya muncul selama Anda memegang alat."),
  ...steps([
    "Nyalakan GPS.",
    "Tekan **Kirim lokasi saya**. Muncul pesan \"Lokasi berhasil dikirim.\"",
  ]),
  p("Bila izin lokasi sudah diberikan, lokasi juga terkirim otomatis setiap aplikasi dibuka (paling sering sekali per 30 menit). Kartu berwarna kuning artinya hari ini belum ada lokasi yang terkirim."),
  tip("Lakukan check-in di awal tugas dan saat tiba di lokasi pelanggan."),
  h2("3.8 Tracking otomatis (Traccar Client)"),
  p("Peramban tidak bisa mengirim lokasi saat HP terkunci. Untuk itu dipakai aplikasi gratis **Traccar Client** (Play Store / App Store). Lokasi **hanya dicatat selama Anda memegang alat**; setelah semua alat dikembalikan, lokasi tidak disimpan lagi."),
  ...steps([
    "Di halaman **Pinjaman saya**, kartu **Tracking otomatis**, tekan **Buat ID perangkat saya**.",
    "Pasang aplikasi **Traccar Client** di HP.",
    "Di Traccar Client, isi **Server URL** dan **Device identifier** dengan nilai dari kartu tadi. Gunakan tombol **Salin** agar tidak salah ketik.",
    "Atur **Frequency** 300 detik, **Location accuracy** High, izin lokasi **Selalu**, dan matikan penghemat baterai untuk aplikasi ini.",
    "Tekan **Start** saat membawa alat, **Stop** setelah semua alat dikembalikan.",
  ]),
  warn("ID perangkat bersifat rahasia. Bila HP hilang atau ganti HP, tekan Buat ID baru; ID lama langsung tidak berlaku dan Traccar Client di HP baru harus diisi ulang."),
  pageBreak(),

  // ===== 4 Admin =====
  h1("4. Panduan Admin"),
  p("Menu admin: **Dashboard**, **Alat**, **Kategori**, **Kode QR**, **Peminjaman**, **Peta teknisi**, **Pengguna**, dan **Audit**. Di HP menu ada di bagian bawah layar (geser ke samping untuk menu lainnya)."),
  h2("4.1 Dashboard"),
  p("Ringkasan kondisi gudang dalam satu layar:"),
  ...bullets([
    "Jumlah alat per status (tersedia, dipinjam), per kondisi (baik, rusak, perbaikan), dan per kategori.",
    "Jumlah pinjaman aktif dan daftar **pinjaman terlambat** (lebih dari 7 hari).",
    "Daftar **Kalibrasi jatuh tempo (30 hari)** (lihat 4.2).",
  ]),
  h2("4.2 Alat"),
  h3("Menambah alat"),
  ...steps([
    "Buka **Alat**, tekan **Tambah**.",
    "Isi **Serial** (wajib, tidak boleh kembar), **Nama** (wajib), **Kategori** (wajib), **Lokasi** penyimpanan, dan **Kondisi** (Baik/Rusak/Perbaikan).",
    "Bila ada, isi **Kalibrasi terakhir** dan **Kalibrasi berikutnya**.",
    "Tekan **Simpan**.",
  ]),
  h3("Mengubah, mencari, dan menyaring"),
  ...bullets([
    "Tekan **Ubah** pada baris alat untuk mengubah data, misalnya kondisi setelah alat diperbaiki.",
    "Gunakan kotak **Cari** (nama atau serial) dan chip filter status (Tersedia/Dipinjam) serta kategori.",
  ]),
  h3("Cara kerja pengingat kalibrasi"),
  p("Aplikasi tidak menghitung jadwal kalibrasi sendiri. Yang dipakai hanya tanggal **Kalibrasi berikutnya** yang diisi admin. Alat masuk daftar jatuh tempo bila tanggal itu **30 hari ke depan atau lebih awal**, termasuk yang sudah lewat. Kolom **Kalibrasi terakhir** hanya sebagai catatan."),
  tip("Setelah alat dikalibrasi, segera perbarui kedua tanggal. Bila tidak, alat terus muncul di daftar jatuh tempo. Alat tanpa tanggal Kalibrasi berikutnya tidak pernah diingatkan."),
  h2("4.3 Kategori"),
  p("Kategori mengelompokkan alat (mis. OTDR, Mesin Fusion Splicer). Setiap kategori punya satu QR."),
  ...bullets([
    "**Tambah:** tekan Tambah, isi Nama, Simpan. Nama kategori tidak boleh kembar.",
    "**Ubah:** tekan Ubah pada baris kategori.",
    "**Hapus:** hanya bisa bila tidak ada alat di kategori itu. Pindahkan atau ubah kategori alatnya dulu.",
  ]),
  h2("4.4 Kode QR (cetak QR kategori)"),
  ...steps([
    "Buka **Kode QR**. Muncul QR untuk setiap kategori.",
    "Tekan **Cetak**. Pilih printer atau **Simpan sebagai PDF**.",
    "Tempel QR di rak atau tas alat sesuai kategorinya.",
  ]),
  warn("QR berisi alamat aplikasi. Bila alamat aplikasi diganti, QR lama tidak bisa dibuka dan harus dicetak ulang dari menu ini."),
  h2("4.5 Peminjaman"),
  p("Daftar seluruh pinjaman. Gunakan chip tampilan untuk memilih pinjaman yang masih aktif atau seluruh riwayat."),
  h3("Mencatat pinjaman manual"),
  p("Dipakai bila teknisi tidak bisa scan QR (mis. HP rusak)."),
  ...steps([
    "Tekan **Pinjamkan alat**.",
    "Pilih unit alat (hanya yang tersedia dan kondisi baik) dan teknisi (hanya akun aktif). Isi Catatan bila perlu.",
    "Tekan **Pinjamkan**.",
  ]),
  h3("Mencatat pengembalian manual"),
  ...steps([
    "Pada pinjaman aktif, tekan **Kembalikan**.",
    "Pilih kondisi alat saat kembali dan isi Catatan bila perlu.",
    "Tekan **Catat pengembalian**.",
  ]),
  tip("Pinjam/kembali manual tidak mencatat lokasi. Sebisa mungkin minta teknisi memakai scan QR."),
  h2("4.6 Peta teknisi"),
  p("Peta posisi teknisi yang sedang memegang alat (OpenStreetMap, gratis)."),
  ...bullets([
    "**Titik besar** = posisi terakhir tiap teknisi. Hijau = aktif, abu-abu = lebih dari 4 jam tidak ada kabar.",
    "**Titik kecil** = riwayat lokasi (saat pinjam, kembali, check-in, atau otomatis dari Traccar).",
    "Pilih **Rentang**: Hari ini, 7 hari, atau 30 hari.",
    "Tekan **Lihat jejak** pada seorang teknisi untuk melihat rute perjalanannya; **Tampilkan semua** untuk kembali.",
  ]),
  p("Riwayat lokasi otomatis terhapus setelah 90 hari."),
  h2("4.7 Pengguna"),
  h3("Menambah akun"),
  ...steps([
    "Buka **Pengguna**, tekan **Tambah**.",
    "Isi **Nama**, **Email (untuk login)**, **Password** (minimal 8 karakter, berisi huruf dan angka), dan **Peran** (Teknisi, Manager, atau Admin).",
    "Pastikan **Akun aktif** tercentang, lalu **Simpan**. Berikan email dan password ke pemilik akun.",
  ]),
  h3("Mengubah akun dan mengganti password"),
  p("Tekan **Ubah**. Kosongkan kolom Password bila tidak ingin mengganti password. Isi password baru bila pengguna lupa password."),
  h3("Menonaktifkan atau menghapus akun"),
  table(
    ["", "Nonaktifkan", "Hapus"],
    [
      ["Cara", "Ubah, hilangkan centang Akun aktif, Simpan", "Tekan Hapus, lalu Ya, hapus"],
      ["Akibat", "Tidak bisa login; data tetap ada; bisa diaktifkan lagi", "Akun hilang permanen, tidak bisa dikembalikan"],
      ["Syarat", "Tidak bisa menonaktifkan akun sendiri", "Akun tidak sedang memegang alat; tidak bisa menghapus akun sendiri"],
      ["Riwayat pinjaman", "Tetap atas nama pengguna", "Tetap tersimpan, nama tampil \"Akun dihapus\""],
    ],
    [18, 41, 41]
  ),
  p("Pada kedua cara, sesi yang sedang terbuka di HP pengguna langsung tidak berlaku.", { spacing: { before: 120, after: 120 } }),
  tip("Untuk karyawan yang cuti atau mungkin kembali, pilih Nonaktifkan. Hapus hanya untuk akun yang benar-benar tidak dipakai lagi."),
  h2("4.8 Audit"),
  p("Catatan siapa melakukan apa dan kapan. Bisa dilihat admin dan manager, tidak bisa diubah atau dihapus oleh siapa pun, dan disimpan 1 tahun."),
  p("Yang dicatat:"),
  ...bullets([
    "**Login**: berhasil, gagal (password salah / email tidak terdaftar), dan ditolak karena akun nonaktif.",
    "**Pinjam/kembali**: lewat scan QR maupun dicatat admin, termasuk kondisi saat kembali.",
    "**Pengguna**: tambah, ubah (beserta perubahannya, mis. \"status: aktif → nonaktif\"), dan hapus. Isi password tidak pernah dicatat.",
    "**Alat dan kategori**: tambah, ubah (beserta perubahannya), hapus kategori.",
    "**Tracking**: teknisi membuat ID perangkat Traccar baru.",
  ]),
  p("Cara memakai: ketik di kotak **Cari** (nama, alat, atau detail) atau pilih chip **Jenis aktivitas**: Login, Pinjam/kembali, Alat, Kategori, Pengguna, Tracking. Waktu ditampilkan dalam WIB."),
  tip("Banyak \"Login gagal\" untuk satu email dalam waktu singkat bisa berarti ada yang mencoba menebak password. Ganti password akun tersebut."),
  pageBreak(),

  // ===== 5 Manager =====
  h1("5. Panduan Manager"),
  p("Manager adalah pengawas: bisa melihat semua data tetapi tidak bisa mengubah apa pun. Saat masuk, tampil banner **Mode manager** dan tombol Tambah, Ubah, Hapus disembunyikan."),
  p("Menu yang bisa dibuka manager:"),
  ...bullets([
    "**Dashboard**: ringkasan gudang, pinjaman terlambat, kalibrasi jatuh tempo (lihat 4.1).",
    "**Alat** dan **Kategori**: lihat data dan cari alat.",
    "**Peminjaman**: lihat pinjaman aktif dan riwayat.",
    "**Peta teknisi**: pantau posisi dan jejak teknisi (lihat 4.6).",
    "**Pengguna**: lihat daftar akun.",
    "**Audit**: pantau seluruh aktivitas (lihat 4.8).",
    "**Bot Telegram**: perintah ringkasan di grup (lihat bab 6).",
  ]),
  p("Bila perlu mengubah data (mis. menambah akun), hubungi admin."),

  // ===== 6 Telegram =====
  h1("6. Bot Telegram"),
  p("Bot terhubung ke satu grup Telegram (atasan dan admin)."),
  h2("6.1 Pesan otomatis"),
  ...bullets([
    "Setiap **pinjam** dan **kembali** dikirim ke grup: nama alat, serial, kategori, teknisi, kondisi, waktu, dan cara pencatatan (Scan QR / dicatat admin). Grup menjadi riwayat yang mudah dibaca.",
    "**Ringkasan pagi** dikirim setiap hari sekitar pukul 08.00 WIB.",
  ]),
  h2("6.2 Perintah di grup"),
  table(
    ["Perintah", "Fungsi"],
    [
      ["/ringkasan", "Ringkasan gudang hari ini: jumlah alat, tersedia, dipinjam, terlambat, rusak/perbaikan, kalibrasi ≤30 hari."],
      ["/dipinjam", "Siapa memegang alat apa saat ini, berapa hari, dan tanda terlambat."],
      ["/terlambat", "Pinjaman yang lewat batas 7 hari."],
      ["/rusak", "Alat berkondisi rusak atau dalam perbaikan."],
      ["/kalibrasi", "Alat yang kalibrasinya jatuh tempo dalam 30 hari (atau sudah lewat)."],
      ["/posisi", "Posisi terakhir teknisi yang sedang memegang alat, dengan tautan Google Maps."],
      ["/riwayat [jumlah]", "Riwayat pinjam dan kembali. Bawaan 10, maksimal 30. Contoh: /riwayat 20"],
      ["/bantuan", "Menampilkan daftar perintah."],
    ],
    [25, 75]
  ),
  pageBreak(),

  // ===== 7 FAQ =====
  h1("7. Aturan Penting dan Pertanyaan Umum"),
  table(
    ["Pertanyaan / masalah", "Jawaban"],
    [
      ["Tombol Pinjam tidak bisa diproses", "GPS mati atau izin lokasi ditolak. Nyalakan GPS dan izinkan lokasi untuk situs ini."],
      ["Kamera tidak terbuka saat Pindai alat", "Izinkan akses kamera di peramban, atau pindai dengan kamera bawaan HP."],
      ["\"QR ini bukan QR Rakit\"", "Yang dipindai bukan QR kategori RAKIT. Gunakan stiker QR dari menu Kode QR."],
      ["Alat tidak bisa dipinjam padahal ada di rak", "Cek status: mungkin masih tercatat dipinjam orang lain (minta dia mengembalikan lewat scan) atau kondisinya Rusak/Perbaikan."],
      ["Lupa password", "Minta admin mengisi password baru di menu Pengguna."],
      ["Akun tidak bisa dihapus", "Akun masih memegang alat. Kembalikan semua alatnya dulu, atau nonaktifkan saja."],
      ["Kapan pinjaman disebut terlambat?", "Setelah lebih dari 7 hari belum dikembalikan."],
      ["Apakah lokasi saya selalu dilacak?", "Tidak. Lokasi hanya dicatat selama Anda memegang alat, dan riwayatnya dihapus otomatis setelah 90 hari."],
      ["Kenapa alat tercatat atas nama orang lain?", "HP dipakai bergantian tanpa Keluar. Selalu cek tulisan \"Masuk sebagai\" sebelum meminjam."],
      ["QR lama tidak bisa dibuka", "Alamat aplikasi sudah berubah. Cetak ulang QR dari menu Kode QR."],
    ],
    [38, 62]
  ),
];

const doc = new Document({
  creator: "RAKIT",
  title: "Panduan Penggunaan RAKIT",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 34, bold: true, color: GREEN },
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 27, bold: true, color: "222222" },
        paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 23, bold: true, color: "444444" },
        paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Panduan Penggunaan RAKIT  ·  Halaman ", { size: 18, color: "777777" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "777777" })] })] }),
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("ok", OUT); });
