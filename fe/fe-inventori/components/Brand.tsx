"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import LogoMark from "./LogoMark";
import Wordmark from "./Wordmark";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-accent">
      <LogoMark size={40} className="shrink-0" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex min-w-0 items-center gap-2">
          <Wordmark className="truncate text-base font-semibold" />
          <span
            data-testid="brand-tags"
            aria-hidden="true"
            className="shrink-0 rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] tracking-widest text-muted max-sm:hidden"
          >
            {BRAND.tags.join(" + ")}
          </span>
        </span>
        {" "}
        <span className={`text-xs text-muted ${compact ? "max-sm:hidden" : ""}`}>{BRAND.company}</span>
      </span>
    </Link>
  );
}
