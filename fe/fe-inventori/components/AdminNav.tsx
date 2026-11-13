"use client";

import { SquaresFour, Tag, Users, Wrench, ArrowsLeftRight, QrCode, MapTrifold } from "@phosphor-icons/react";
import NavRail, { type NavItem } from "@/components/NavRail";
import { useRole } from "@/components/useSession";
import { isManager } from "@/lib/permissions";

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: SquaresFour, group: "Ringkasan" },
  { href: "/admin/equipment", label: "Alat", icon: Wrench, group: "Aset" },
  { href: "/admin/categories", label: "Kategori", icon: Tag, group: "Aset" },
  { href: "/admin/categories/qr", label: "Kode QR", icon: QrCode, group: "Aset" },
  { href: "/admin/loans", label: "Peminjaman", icon: ArrowsLeftRight, group: "Aktivitas" },
  { href: "/admin/locations", label: "Peta teknisi", icon: MapTrifold, group: "Aktivitas" },
  { href: "/admin/users", label: "Pengguna", icon: Users, group: "Administrasi" },
];

/** Manager tidak butuh cetak QR (pekerjaan admin). */
const managerItems = items.filter((i) => i.href !== "/admin/categories/qr");

export default function AdminNav() {
  const manager = isManager(useRole());
  return <NavRail items={manager ? managerItems : items} label={manager ? "Manager" : "Admin"} root="/admin" />;
}
