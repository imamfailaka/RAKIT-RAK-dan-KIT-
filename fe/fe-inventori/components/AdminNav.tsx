"use client";

import { SquaresFour, Tag, Users, Wrench, ArrowsLeftRight, QrCode } from "@phosphor-icons/react";
import NavRail, { type NavItem } from "@/components/NavRail";

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: SquaresFour, group: "Ringkasan" },
  { href: "/admin/equipment", label: "Alat", icon: Wrench, group: "Aset" },
  { href: "/admin/categories", label: "Kategori", icon: Tag, group: "Aset" },
  { href: "/admin/categories/qr", label: "Kode QR", icon: QrCode, group: "Aset" },
  { href: "/admin/loans", label: "Peminjaman", icon: ArrowsLeftRight, group: "Aktivitas" },
  { href: "/admin/users", label: "Pengguna", icon: Users, group: "Administrasi" },
];

export default function AdminNav() {
  return <NavRail items={items} label="Admin" root="/admin" />;
}
