# Membangun diagram use case Sistem Rakit (SVG) sesuai fitur yang sudah dibuat.
W, H = 1400, 1360
BOX_X1, BOX_X2, TOP = 320, 1000, 40
CX, EW, EH = 660, 380, 42
cases = [
    ("login", "Login"),
    ("users", "Mengelola pengguna (membuat akun)"),
    ("cat", "Mengelola kategori"),
    ("alat", "Mengelola data alat"),
    ("qr", "Mencetak QR kategori"),
    ("pinjam_m", "Mencatat peminjaman manual"),
    ("kembali_m", "Mencatat pengembalian manual"),
    ("dash", "Melihat dashboard ringkasan"),
    ("lihat_user", "Melihat daftar pengguna"),
    ("peta", "Melihat peta & jejak lokasi teknisi"),
    ("riwayat", "Melihat riwayat peminjaman"),
    ("notif", "Menerima notifikasi & ringkasan harian Telegram"),
    ("bot", "Memantau lewat perintah bot Telegram"),
    ("daftar_alat", "Melihat daftar alat"),
    ("dipinjam", "Melihat yang sedang dipinjam"),
    ("scan", "Scan QR kategori"),
    ("pinjam", "Meminjam unit (scan)"),
    ("kembali", "Mengembalikan unit (scan)"),
    ("gps", "Mengirim lokasi GPS (selama memegang alat)"),
    ("tracker", "Mengatur tracking otomatis (Traccar)"),
    ("saya", "Melihat pinjaman saya"),
]
Y0, GAP = 130, 56
pos = {k: Y0 + i * GAP for i, (k, _) in enumerate(cases)}
actors = {
    "Admin": (170, 560, "left"),
    "Manager": (1230, 560, "right"),
    "Teknisi": (1230, 1060, "right"),
}
links = {
    "Admin": ["login", "users", "cat", "alat", "qr", "pinjam_m", "kembali_m", "dash", "peta", "riwayat", "notif", "bot", "daftar_alat", "dipinjam"],
    "Manager": ["login", "dash", "lihat_user", "peta", "riwayat", "notif", "bot", "daftar_alat", "dipinjam"],
    "Teknisi": ["login", "daftar_alat", "dipinjam", "scan", "pinjam", "kembali", "gps", "tracker", "saya"],
}
includes = [("pinjam", "scan"), ("kembali", "scan"), ("pinjam", "gps"), ("kembali", "gps")]

out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="DejaVu Sans, Arial, sans-serif">',
       '<defs><marker id="open" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10" fill="none" stroke="#000" stroke-width="1.2"/></marker></defs>',
       f'<rect width="{W}" height="{H}" fill="#fff"/>',
       f'<rect x="{BOX_X1}" y="{TOP}" width="{BOX_X2-BOX_X1}" height="{H-TOP-30}" fill="none" stroke="#000" stroke-width="1.5"/>',
       f'<line x1="{BOX_X1}" y1="{TOP+50}" x2="{BOX_X2}" y2="{TOP+50}" stroke="#000" stroke-width="1"/>',
       f'<text x="{CX}" y="{TOP+32}" text-anchor="middle" font-size="18" font-weight="bold">Sistem Rakit</text>']

# asosiasi aktor -> use case (digambar dulu agar di bawah elips)
for actor, keys in links.items():
    ax, ay, side = actors[actor]
    sx = ax + 32 if side == "left" else ax - 32
    for k in keys:
        ex = CX - EW / 2 if side == "left" else CX + EW / 2
        out.append(f'<line x1="{sx}" y1="{ay-20}" x2="{ex}" y2="{pos[k]}" stroke="#000" stroke-width="1"/>')

for k, label in cases:
    y = pos[k]
    out.append(f'<ellipse cx="{CX}" cy="{y}" rx="{EW/2}" ry="{EH/2}" fill="#fff" stroke="#000" stroke-width="1.2"/>')
    out.append(f'<text x="{CX}" y="{y+5}" text-anchor="middle" font-size="13.5">{label.replace("&", "&amp;")}</text>')

# <<include>>: busur putus-putus di sisi kiri elips
bends = {("pinjam", "scan"): 35, ("kembali", "scan"): 75, ("kembali", "gps"): 35, ("pinjam", "gps"): 75}
for a, b in includes:
    ya, yb = pos[a], pos[b]
    x0 = CX - EW / 2
    bend = bends[(a, b)]
    mid = (ya + yb) / 2
    out.append(f'<path d="M{x0},{ya} C{x0-bend*1.33},{ya} {x0-bend*1.33},{yb} {x0},{yb}" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="6,4" marker-end="url(#open)"/>')
    out.append(f'<text x="{x0-bend-4}" y="{mid+4}" text-anchor="end" font-size="11" font-style="italic">«include»</text>')

def stick(x, y, name):
    return (f'<g stroke="#000" stroke-width="1.6" fill="none"><circle cx="{x}" cy="{y-70}" r="16" fill="#fff"/>'
            f'<line x1="{x}" y1="{y-54}" x2="{x}" y2="{y}"/><line x1="{x-32}" y1="{y-20}" x2="{x+32}" y2="{y-20}"/>'
            f'<line x1="{x}" y1="{y}" x2="{x-24}" y2="{y+38}"/><line x1="{x}" y1="{y}" x2="{x+24}" y2="{y+38}"/></g>'
            f'<text x="{x}" y="{y+62}" text-anchor="middle" font-size="16" font-weight="bold">{name}</text>')
for name, (x, y, _) in actors.items():
    out.append(stick(x, y, name))

out.append(f'<text x="{BOX_X1}" y="{H-8}" font-size="11" fill="#444">Aplikasi internal: tidak ada registrasi publik, semua akun dibuat admin. Lokasi teknisi hanya dicatat selama memegang alat.</text>')
out.append('</svg>')
open("usecase-rakit.svg", "w").write("\n".join(out))
