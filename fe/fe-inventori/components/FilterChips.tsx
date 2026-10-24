export type ChipOption = { value: string; label: string };

/** Pilihan filter satu-dari-banyak. Tombol bertanda aria-pressed agar terbaca pembaca layar. */
export default function FilterChips({
  options,
  value,
  onChange,
  label = "Filter",
}: {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-9 items-center rounded-[14px] border px-3.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              on ? "border-accent bg-accent font-semibold text-accent-ink" : "border-line-strong text-muted hover:bg-surface-alt hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
