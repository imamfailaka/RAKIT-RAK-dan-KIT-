import type { ReactNode } from "react";
import Brand from "@/components/Brand";
import MobileBar from "@/components/MobileBar";
import UserCard from "@/components/UserCard";

/**
 * Sidebar (merek, menu bergrup, kartu pengguna) di layar lebar; di layar sempit
 * bilah atas untuk merek dan bilah menu tetap di bawah.
 */
export default function SiteShell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col md:flex-row">
      <aside className="md:sticky md:top-0 md:flex md:h-[100dvh] md:w-60 md:shrink-0 md:flex-col md:border-r md:border-line md:bg-rail">
        <div className="hidden p-4 md:block">
          <Brand />
        </div>
        <div className="md:flex-1 md:overflow-y-auto">{nav}</div>
        <div className="hidden md:block">
          <UserCard />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
