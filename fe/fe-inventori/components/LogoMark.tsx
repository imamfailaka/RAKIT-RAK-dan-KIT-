/** Logo Rakit: rak dengan empat blok stok. Warna dari token Tailwind, bukan warna mentah. */
export default function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      data-logo-mark
      width={size}
      height={size}
      viewBox="0 0 56 56"
      aria-hidden="true"
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="53" height="53" rx="8" fill="none" strokeWidth="3" className="stroke-ink" />
      <line x1="0" y1="28" x2="56" y2="28" strokeWidth="3" className="stroke-ink" />
      <rect x="8" y="8" width="14" height="16" className="fill-accent" />
      <rect x="26" y="14" width="12" height="10" className="fill-ink" />
      <rect x="8" y="38" width="18" height="14" className="fill-ink" />
      <rect x="32" y="34" width="16" height="18" className="fill-accent" />
    </svg>
  );
}
