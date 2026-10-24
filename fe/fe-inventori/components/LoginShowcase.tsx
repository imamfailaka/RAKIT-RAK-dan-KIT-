import { BRAND } from "@/lib/brand";
import LogoMark from "./LogoMark";
import Wordmark from "./Wordmark";

const POINTS = [
  "Alat dilacak per nomor seri",
  "Scan QR kategori, pinjam dan kembali tercatat",
  "Kalibrasi dan pinjaman terlambat diingatkan",
] as const;

const STEP_MS = 80;
const rise = "animate-rise motion-reduce:animate-none";

export default function LoginShowcase() {
  return (
    <aside
      data-testid="login-showcase"
      className="relative flex flex-1 flex-col justify-between overflow-hidden bg-rail p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div className={`relative flex items-center gap-4 ${rise}`}>
        <LogoMark size={72} />
        <Wordmark className="text-3xl font-semibold" />
      </div>
      <div className="relative max-w-md">
        <h2 className={`text-3xl font-semibold leading-tight text-ink ${rise}`} style={{ animationDelay: `${STEP_MS}ms` }}>
          Semua peralatan teknisi, terlacak per unit.
        </h2>
        <ul className="mt-8 flex flex-col gap-4">
          {POINTS.map((point, i) => (
            <li
              key={point}
              className={`flex items-center gap-3 text-muted ${rise}`}
              style={{ animationDelay: `${STEP_MS * (i + 2)}ms` }}
            >
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-accent" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-muted">{BRAND.company}</p>
    </aside>
  );
}
