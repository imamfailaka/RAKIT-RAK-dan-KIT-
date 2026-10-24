import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";
import SiteShell from "@/components/SiteShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SiteShell nav={<AdminNav />}>{children}</SiteShell>;
}
