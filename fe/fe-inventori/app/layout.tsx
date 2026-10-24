import type { Metadata } from "next";
import "@fontsource-variable/sora";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: `${BRAND.app} | ${BRAND.company}`,
  description: `Pantau peminjaman alat teknisi ${BRAND.company}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
