"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";

export type NavItem = { href: string; label: string; icon: Icon; /** Judul kelompok; hanya tampil di layar lebar. */ group?: string };

/**
 * Menu utama: kolom bergrup di layar lebar, bilah tetap di bawah layar sempit
 * (dalam jangkauan jempol, tanpa harus menggeser ke atas).
 */
export default function NavRail({ items, label, root }: { items: NavItem[]; label: string; root: string }) {
  const path = usePathname();
  return (
    <nav
      aria-label={label}
      className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:flex max-md:gap-1 max-md:overflow-x-auto max-md:border-t max-md:border-line max-md:bg-rail max-md:p-2 md:flex md:flex-col md:gap-1 md:p-3"
    >
      {items.map(({ href, label: name, icon: IconCmp, group }, i) => {
        const active = href === root ? path === root : path.startsWith(href);
        const heading = group && group !== items[i - 1]?.group ? group : null;
        return (
          <Fragment key={href}>
            {heading && <p className="hidden px-3.5 pt-3 pb-1 text-xs font-medium text-muted first:pt-0 md:block">{heading}</p>}
            <Link
              href={href}
              title={name}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center rounded-[14px] whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-accent md:min-h-11 md:gap-3 md:px-3.5 md:text-sm max-md:min-w-[4.5rem] max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:px-2 max-md:py-1.5 max-md:text-[11px] ${
                active ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:bg-surface-alt hover:text-ink"
              }`}
            >
              <IconCmp size={20} weight={active ? "bold" : "regular"} aria-hidden />
              {name}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
