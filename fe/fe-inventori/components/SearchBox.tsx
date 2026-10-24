import { MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full md:max-w-sm">
      <MagnifyingGlass size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label="Cari"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Cari..."}
        className="h-11 w-full rounded-[14px] border border-line-strong bg-canvas pr-3.5 pl-10 text-[15px] outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
