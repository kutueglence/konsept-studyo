import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/yonetim", label: "Gösterge Paneli", icon: "📊" },
  { href: "/yonetim/urunler", label: "Ürünler", icon: "📦" },
  { href: "/yonetim/kategoriler", label: "Kategoriler", icon: "🗂️" },
  { href: "/yonetim/konseptler", label: "Tasarımlar", icon: "🎨" },
  { href: "/yonetim/teklifler", label: "Teklifler", icon: "🧾" },
  { href: "/yonetim/musteriler", label: "Müşteriler", icon: "👥" },
  { href: "/yonetim/yayin", label: "Kalıcı Yayın", icon: "🌐" },
];

export default function YonetimLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎈</span>
            <span className="text-sm font-bold text-slate-900">Konsept Stüdyo · Yönetim</span>
          </Link>
          <Link href="/tasarim" className="btn-primary text-sm">
            🎨 Tasarım Stüdyosu
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6">
        <nav className="hidden w-52 shrink-0 space-y-1 md:block">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm"
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="chip whitespace-nowrap">
                {n.icon} {n.label}
              </Link>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
