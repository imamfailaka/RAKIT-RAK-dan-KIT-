import { BRAND } from "@/lib/brand";

/**
 * Nama aplikasi dua warna. Pembaca layar membaca satu kata utuh ("Rakit") dari teks sr-only;
 * dua potongan berwarna disembunyikan dari pembaca layar agar tidak terbaca "Ra kit".
 * Huruf kapital hanya lewat CSS.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`uppercase tracking-wide ${className ?? ""}`.trim()}>
      <span className="sr-only">{BRAND.app}</span>
      <span aria-hidden="true">
        <span className="text-ink">{BRAND.wordmark.lead}</span>
        <span className="text-accent">{BRAND.wordmark.accent}</span>
      </span>
    </span>
  );
}
