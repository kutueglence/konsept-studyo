import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { designs } from "@/db/schema";
import DeleteDesignButton from "@/components/DeleteDesignButton";

export const dynamic = "force-dynamic";

export default async function KonseptlerPage() {
  const rows = await db.select().from(designs).orderBy(desc(designs.updatedAt));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kayıtlı Konseptler</h1>
          <p className="text-sm text-slate-500">Tasarımlarınızı açın, düzenleyin veya teklife dönüştürün.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasarim" className="btn-primary">
            + Yeni Tasarım
          </Link>
          <Link href="/" className="btn-outline">
            Ana Sayfa
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          <p className="mb-2 text-4xl">🗂️</p>
          Henüz kayıtlı konsept yok.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((d) => {
            const itemCount = Array.isArray(d.items) ? (d.items as unknown[]).length : 0;
            return (
              <div key={d.id} className="card flex flex-col p-4">
                <div
                  className="mb-3 flex h-24 items-center justify-center rounded-xl text-3xl"
                  style={{ background: d.coverColor }}
                >
                  {d.isTemplate ? "✨" : "🎉"}
                </div>
                <h3 className="truncate text-sm font-bold text-slate-800">{d.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {d.customerName || "Müşteri belirtilmedi"} · {d.eventType || "Etkinlik"}
                </p>
                <p className="text-xs text-slate-500">
                  {d.eventDate || "Tarih yok"} · {itemCount} nesne
                </p>
                <p className="mt-2 text-lg font-bold text-indigo-600">
                  {Number(d.total).toLocaleString("tr-TR")} ₺
                </p>
                {d.isTemplate && <span className="chip chip-active mt-2 w-fit">Hazır Konsept</span>}
                <div className="mt-3 flex gap-2">
                  <Link href={`/tasarim?id=${d.id}`} className="btn-primary flex-1 px-2 py-1.5 text-xs">
                    Aç & Düzenle
                  </Link>
                  <DeleteDesignButton id={d.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
