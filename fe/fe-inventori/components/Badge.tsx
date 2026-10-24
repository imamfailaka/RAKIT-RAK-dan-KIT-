import type { ReactNode } from "react";
import type { Tone } from "@/lib/status";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok-ink ring-ok-ink/20",
  warn: "bg-warn-bg text-warn-ink ring-warn-ink/25",
  danger: "bg-danger-bg text-danger-ink ring-danger-ink/25",
  info: "bg-info-bg text-info-ink ring-info-ink/25",
  neutral: "bg-surface-alt text-muted ring-line-strong",
};

/** Status label. The text always carries the meaning; colour only reinforces it. */
export default function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
