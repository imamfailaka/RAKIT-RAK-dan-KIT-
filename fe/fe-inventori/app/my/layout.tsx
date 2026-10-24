import type { ReactNode } from "react";
import SiteShell from "@/components/SiteShell";
import TechNav from "@/components/TechNav";

export default function MyLayout({ children }: { children: ReactNode }) {
  return <SiteShell nav={<TechNav />}>{children}</SiteShell>;
}
