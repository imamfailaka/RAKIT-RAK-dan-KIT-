import type { ReactNode } from "react";
import Brand from "./Brand";
import LoginShowcase from "./LoginShowcase";

/** Tata letak dua kolom untuk halaman login. Formulir ada lebih dulu di DOM; panel sorotan tampil di kiri hanya di layar lebar. */
export default function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <main className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <div className="rounded-[var(--radius-ui)] border border-line bg-surface p-6 sm:p-8">{children}</div>
        </div>
      </main>
      <div className="hidden lg:order-first lg:flex">
        <LoginShowcase />
      </div>
    </div>
  );
}
