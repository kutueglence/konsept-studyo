import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { designs } from "@/db/schema";
import TemplateToggle from "@/components/admin/TemplateToggle";
import DeleteDesignButton from "@/components/DeleteDesignButton";

export const dynamic = "force-dynamic";

export default async function AdminKonseptlerPage() {
  const rows = await db.select().from(designs).orderBy(desc(designs.updatedAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasarımlar</h1>
          <p className="text-sm text-slate-500">
            Kayıtlı konseptleri görüntüleyin; bir tasarımı “hazır konsept” yaparak müşterilere sunun.
          </p>
        </div>
        <Link href="/tasarim" className="btn-primary text-sm">
          + Yeni Tasarım
        </Link>
      </div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
              <th className="py-2">Konsept</th>
              <th className="py-2">Müşteri</th>
              <th className="py-2">Etkinlik</th>
              <th className="py-2 text-center">Nesne</th>
              <th className="py-2 text-right">Tutar</th>
              <th className="py-2 text-center">Hazır Konsept</th>
              <th className="py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-800">{d.name}</td>
                <td className="py-2 text-xs text-slate-600">{d.customerName || "—"}</td>
                <td className="py-2 text-xs text-slate-600">
                  {d.eventType || "—"}
                  <span className="block text-slate-400">{d.eventDate || ""}</span>
                </td>
                <td className="py-2 text-center">{Array.isArray(d.items) ? (d.items as unknown[]).length : 0}</td>
                <td className="py-2 text-right font-semibold">{Number(d.total).toLocaleString("tr-TR")} ₺</td>
                <td className="py-2 text-center">
                  <TemplateToggle id={d.id} value={d.isTemplate} />
                </td>
                <td className="py-2 text-right">
                  <Link href={`/tasarim?id=${d.id}`} className="btn-ghost px-2 py-1 text-xs">
                    Aç
                  </Link>
                  <DeleteDesignButton id={d.id} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  Henüz tasarım kaydedilmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
