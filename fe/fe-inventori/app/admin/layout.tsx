import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";
import SiteShell from "@/components/SiteShell";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell nav={<AdminNav />}>
      <ReadOnlyBanner />
      {children}
    </SiteShell>
  );
}
