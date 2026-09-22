import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konsept Stüdyo · Doğum Günü & Özel Gün Tasarım Simülatörü",
  description:
    "Etkinlik alanınızı 2D/3D olarak tasarlayın, ürünleri sürükleyip bırakın, anında fiyat hesaplayın ve profesyonel teklif oluşturun.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
