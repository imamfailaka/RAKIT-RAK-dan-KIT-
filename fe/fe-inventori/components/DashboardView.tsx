import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CONDITION_LABEL, dateOrDash, refName } from "@/lib/labels";
import type { Tone } from "@/lib/status";
import type { AdminDashboard } from "@/services/dashboard";

const VALUE: Record<Tone, string> = {
  ok: "text-ink",
  warn: "text-warn-ink",
  danger: "text-danger-ink",
  info: "text-info-ink",
  neutral: "text-ink",
};
const DOT: Record<Tone, string> = {
  ok: "bg-ok-ink",
  warn: "bg-warn-ink",
  danger: "bg-danger-ink",
  info: "bg-info-ink",
  neutral: "bg-muted",
};

function Stat({ label, value, href, tone = "neutral" }: { label: string; value: number; href: string; tone?: Tone }) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-tone={tone}
      className={`block rounded-[14px] border p-4 transition hover:border-line-strong hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-accent ${
        tone === "danger" ? "border-danger-ink/30 bg-danger-bg" : "border-line bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${VALUE[tone]}`}>{value}</p>
    </Link>
  );
}

const BAR: Record<"good" | "broken" | "repair", string> = { good: "bg-ok-ink", broken: "bg-danger-ink", repair: "bg-warn-ink" };

/** Bar tumpuk kondisi alat; teks pengganti dibaca pembaca layar lewat aria-label. */
function ConditionBar({ by }: { by: AdminDashboard["equipmentByCondition"] }) {
  const total = by.good + by.broken + by.repair;
  const summary = `Kondisi alat: ${by.good} baik, ${by.broken} rusak, ${by.repair} perbaikan`;
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={summary} className="flex h-3 w-full overflow-hidden rounded-full bg-surface-alt">
        {total > 0 &&
          (["good", "broken", "repair"] as const).map((c) =>
            by[c] > 0 ? <span key={c} className={BAR[c]} style={{ width: `${(by[c] / total) * 100}%` }} /> : null,
          )}
      </div>
      <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {(["good", "broken", "repair"] as const).map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${BAR[c]}`} />
            {CONDITION_LABEL[c]} <span className="tabular-nums text-muted">{by[c]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, empty, tone = "neutral", children }: { title: string; empty: string; tone?: Tone; children: React.ReactNode[] }) {
  return (
    <section data-tone={tone} className="rounded-[14px] border border-line bg-surface p-4">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${DOT[tone]}`} />
        {title}
      </h2>
      {children.length === 0 ? <p className="text-sm text-muted">{empty}</p> : <ul className="flex flex-col gap-1.5 text-sm">{children}</ul>}
    </section>
  );
}

export default function DashboardView({ data, now }: { data: AdminDashboard; now: number }) {
  const days = (iso: string) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86400000));
  const broken = data.equipmentByCondition.broken + data.equipmentByCondition.repair;
  const today = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(now);
  return (
    <div className="flex flex-col gap-6">
      <div className="-mt-2 text-sm text-muted">
        <p>{today}</p>
        <p>{BRAND.company}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Alat tersedia" value={data.equipmentByStatus.available} href="/admin/equipment" />
        <Stat label="Alat dipinjam" value={data.equipmentByStatus.borrowed} href="/admin/loans" tone={data.equipmentByStatus.borrowed > 0 ? "info" : "neutral"} />
        <Stat label="Alat rusak atau perbaikan" value={broken} href="/admin/equipment" tone={broken > 0 ? "danger" : "ok"} />
        <Stat label="Pinjaman aktif" value={data.activeLoans} href="/admin/loans" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title={`Pinjaman terlambat (> ${data.overdueDays} hari): ${data.overdueLoansCount}`} empty="Tidak ada pinjaman terlambat." tone={data.overdueLoansCount > 0 ? "danger" : "ok"}>
          {data.overdueLoans.map((l) => (
            <li key={l._id} className="flex justify-between gap-2">
              <span className="flex gap-1"><span>{refName(l.equipment)}</span><span aria-hidden>·</span><span>{refName(l.technician)}</span></span>
              <span className="text-muted tabular-nums">{dateOrDash(l.borrowedAt)} ({days(l.borrowedAt)} hari)</span>
            </li>
          ))}
        </Section>
        <Section title={`Kalibrasi jatuh tempo (30 hari): ${data.calibrationDueCount}`} empty="Tidak ada kalibrasi yang akan jatuh tempo." tone={data.calibrationDueCount > 0 ? "warn" : "ok"}>
          {data.calibrationDue.map((e) => (
            <li key={e._id} className="flex justify-between gap-2">
              <span>{e.name || "-"} ({e.serial || "-"})</span>
              <span className="text-muted tabular-nums">{dateOrDash(e.nextCalibration)}</span>
            </li>
          ))}
        </Section>
        <section className="rounded-[14px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-medium">Alat per kategori</h2>
          {data.equipmentByCategory.length === 0 ? (
            <p className="text-sm text-muted">Belum ada alat.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.equipmentByCategory.map((c) => (
                <li key={c.name}>
                  <Link href="/admin/equipment" className="flex items-center justify-between gap-2 hover:text-accent">
                    <span>{c.name}</span>
                    <span className="tabular-nums text-muted">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-[14px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-medium">Kondisi alat</h2>
          <ConditionBar by={data.equipmentByCondition} />
        </section>
      </div>
    </div>
  );
}
