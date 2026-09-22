import Link from "next/link";
import { count, sum } from "drizzle-orm";
import { db } from "@/db";
import { designs, products, quotes } from "@/db/schema";
import { getCategoryTree } from "@/lib/server/catalog";
import DemoDataButtons from "@/components/admin/DemoDataButtons";

export const dynamic = "force-dynamic";

export default async function YonetimPage() {
  const tree = await getCategoryTree();
  const [productStats] = await db.select({ c: count(), stock: sum(products.stock) }).from(products);
  const [designStats] = await db.select({ c: count() }).from(designs);
  const [quoteStats] = await db.select({ c: count(), total: sum(quotes.total) }).from(quotes);

  const cards = [
    { label: "Ürün", value: productStats?.c ?? 0, icon: "📦", href: "/yonetim/urunler" },
    { label: "Kategori", value: tree.length, icon: "🗂️", href: "/yonetim/kategoriler" },
    { label: "Tasarım", value: designStats?.c ?? 0, icon: "🎨", href: "/yonetim/konseptler" },
    { label: "Teklif", value: quoteStats?.c ?? 0, icon: "🧾", href: "/yonetim/teklifler" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gösterge Paneli</h1>
        <p className="text-sm text-slate-500">
          Ürün kataloğunuzu yönetin, tasarımları ve teklifleri takip edin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-4 transition hover:shadow-md">
            <div className="text-2xl">{c.icon}</div>
            <p className="mt-2 text-2xl font-black text-slate-900">{c.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-800">Hızlı İşlemler</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/yonetim/urunler" className="btn-primary text-sm">
              + Ürün Ekle
            </Link>
            <Link href="/yonetim/kategoriler" className="btn-outline text-sm">
              + Kategori Ekle
            </Link>
            <Link href="/tasarim" className="btn-soft text-sm">
              🎨 Yeni Konsept Tasarla
            </Link>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Demo Veri</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Sistemde sabit ürün tanımı yoktur. Programı denemek için örnek bir ürün paketi
              yükleyebilir, kendi ürünlerinizi eklemeden önce tek tıkla temizleyebilirsiniz.
            </p>
            <DemoDataButtons />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-800">Kategori Ağacı</h2>
          <p className="text-xs text-slate-500">Toplam stok: {Number(productStats?.stock ?? 0)} adet</p>
          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {tree.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-700">
                  {c.icon} {c.name}
                </p>
                <p className="text-[11px] text-slate-500">{c.subs.map((s) => s.name).join(" · ") || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
