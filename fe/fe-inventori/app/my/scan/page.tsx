import QrScanner from "@/components/QrScanner";

/** Pindai QR kategori dengan kamera; halaman kategori lalu menampilkan unit untuk dipinjam atau dikembalikan. */
export default function MyScanPage() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Pindai alat</h1>
      <QrScanner />
    </div>
  );
}
