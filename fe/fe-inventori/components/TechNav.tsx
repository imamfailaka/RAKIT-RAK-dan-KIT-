"use client";

import { ArrowsLeftRight, QrCode, Wrench } from "@phosphor-icons/react";
import NavRail, { type NavItem } from "@/components/NavRail";

const items: NavItem[] = [
  { href: "/my", label: "Pinjaman saya", icon: ArrowsLeftRight, desktopOnly: true },
  { href: "/my/scan", label: "Pindai alat", icon: QrCode },
  { href: "/my/equipment", label: "Alat", icon: Wrench, desktopOnly: true },
];

export default function TechNav() {
  return <NavRail items={items} label="Teknisi" root="/my" />;
}
