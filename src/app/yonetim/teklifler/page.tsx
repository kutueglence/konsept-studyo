import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import type { MaterialLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TekliflerPage() {
  const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  const toplam = rows.reduce((s, q) => s + Number(q.total), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teklifler</h1>
        <p className="text-sm text-slate-500">
          {rows.length} teklif · toplam {toplam.toLocaleString("tr-TR")} ₺
        </p>
      </div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
              <th className="py-2">No</th>
              <th className="py-2">Konsept</th>
              <th className="py-2">Müşteri</th>
              <th className="py-2">Etkinlik</th>
              <th className="py-2 text-center">Kalem</th>
              <th className="py-2 text-right">Tutar</th>
              <th className="py-2 text-center">Durum</th>
              <th className="py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => {
              const lines = (q.lines as MaterialLine[]) ?? [];
              return (
                <tr key={q.id} className="border-b border-slate-100">
                  <td className="py-2 font-mono text-xs">#{String(q.id).padStart(4, "0")}</td>
                  <td className="py-2 font-medium text-slate-800">{q.conceptName || "—"}</td>
                  <td className="py-2 text-xs text-slate-600">
                    {q.customerName || "—"}
                    <span className="block text-slate-400">{q.customerPhone || ""}</span>
                  </td>
                  <td className="py-2 text-xs text-slate-600">
                    {q.eventType || "—"}
                    <span className="block text-slate-400">{q.eventDate || ""}</span>
                  </td>
                  <td className="py-2 text-center">{lines.length}</td>
                  <td className="py-2 text-right font-semibold">{Number(q.total).toLocaleString("tr-TR")} ₺</td>
                  <td className="py-2 text-center">
                    <span className="chip">{q.status}</span>
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/teklif/${q.id}`} className="btn-ghost px-2 py-1 text-xs">
                      Görüntüle
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Henüz teklif oluşturulmadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
