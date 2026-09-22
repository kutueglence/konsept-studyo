import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { designs, quotes } from "@/db/schema";

export const dynamic = "force-dynamic";

interface CustomerRow {
  name: string;
  phone: string;
  designs: number;
  quotes: number;
  total: number;
  lastEvent: string;
  lastDesignId?: number;
}

export default async function MusterilerPage() {
  const [designRows, quoteRows] = await Promise.all([
    db.select().from(designs).orderBy(desc(designs.updatedAt)),
    db.select().from(quotes).orderBy(desc(quotes.createdAt)),
  ]);

  const map = new Map<string, CustomerRow>();
  const key = (n?: string | null) => (n?.trim() ? n.trim().toLocaleLowerCase("tr") : "");

  for (const d of designRows) {
    const k = key(d.customerName);
    if (!k) continue;
    const row = map.get(k) ?? {
      name: d.customerName as string,
      phone: d.customerPhone ?? "",
      designs: 0,
      quotes: 0,
      total: 0,
      lastEvent: d.eventDate ?? "",
    };
    row.designs += 1;
    row.phone = row.phone || (d.customerPhone ?? "");
    row.lastEvent = row.lastEvent || (d.eventDate ?? "");
    row.lastDesignId = row.lastDesignId ?? d.id;
    map.set(k, row);
  }
  for (const q of quoteRows) {
    const k = key(q.customerName);
    if (!k) continue;
    const row = map.get(k) ?? {
      name: q.customerName as string,
      phone: q.customerPhone ?? "",
      designs: 0,
      quotes: 0,
      total: 0,
      lastEvent: q.eventDate ?? "",
    };
    row.quotes += 1;
    row.total += Number(q.total);
    row.phone = row.phone || (q.customerPhone ?? "");
    map.set(k, row);
  }

  const customers = [...map.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
        <p className="text-sm text-slate-500">
          Kayıtlı tasarım ve tekliflerden otomatik oluşturulan müşteri listesi.
        </p>
      </div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
              <th className="py-2">Müşteri</th>
              <th className="py-2">Telefon</th>
              <th className="py-2 text-center">Tasarım</th>
              <th className="py-2 text-center">Teklif</th>
              <th className="py-2 text-right">Teklif Tutarı</th>
              <th className="py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.name} className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-800">{c.name}</td>
                <td className="py-2 text-xs text-slate-600">{c.phone || "—"}</td>
                <td className="py-2 text-center">{c.designs}</td>
                <td className="py-2 text-center">{c.quotes}</td>
                <td className="py-2 text-right font-semibold">{c.total.toLocaleString("tr-TR")} ₺</td>
                <td className="py-2 text-right">
                  {c.lastDesignId && (
                    <Link href={`/tasarim?id=${c.lastDesignId}`} className="btn-ghost px-2 py-1 text-xs">
                      Tasarımı Aç
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  Henüz müşteri kaydı yok. Konsept kaydederken müşteri adı girin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
