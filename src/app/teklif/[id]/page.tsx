import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import QuoteActions from "@/components/QuoteActions";
import type { MaterialLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeklifPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, Number(id)));
  if (!quote) notFound();

  const lines = (quote.lines as MaterialLine[]) ?? [];
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const discount = Number(quote.discount ?? 0);
  const grand = Math.max(0, subtotal - discount);
  const created = new Date(quote.createdAt).toLocaleDateString("tr-TR");

  return (
    <div className="min-h-dvh bg-slate-100 py-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link href={quote.designId ? `/tasarim?id=${quote.designId}` : "/tasarim"} className="btn-outline text-sm">
            ← Tasarıma Dön
          </Link>
          <QuoteActions
            quoteId={quote.id}
            phone={quote.customerPhone ?? ""}
            summary={`${quote.conceptName ?? "Konsept"} teklifi: ${grand.toLocaleString("tr-TR")} ₺`}
          />
        </div>

        <div className="print-page card mx-auto bg-white p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎈</span>
                <h1 className="text-xl font-black tracking-tight text-slate-900">{quote.companyName}</h1>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Doğum Günü & Özel Gün Konsept Tasarım ve Kiralama
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="text-sm font-bold text-slate-800">TEKLİF #{String(quote.id).padStart(4, "0")}</p>
              <p>Düzenleme: {created}</p>
              <p>Durum: {quote.status}</p>
            </div>
          </div>

          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <InfoBlock title="Müşteri">
              <p className="font-semibold text-slate-800">{quote.customerName || "—"}</p>
              <p>{quote.customerPhone || ""}</p>
            </InfoBlock>
            <InfoBlock title="Etkinlik">
              <p className="font-semibold text-slate-800">{quote.conceptName || "Konsept"}</p>
              <p>
                {quote.eventType || "—"} · {quote.eventDate || "Tarih belirtilmedi"}
              </p>
            </InfoBlock>
          </div>

          {quote.preview && (
            <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quote.preview} alt="Konsept görseli" className="w-full object-contain" />
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-600">
                <th className="py-2">Ürün / Hizmet</th>
                <th className="py-2 text-center">Adet</th>
                <th className="py-2 text-right">Birim Fiyat</th>
                <th className="py-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.key} className="border-b border-slate-100">
                  <td className="py-2">
                    <span className="font-medium text-slate-800">{l.name}</span>
                    {l.category ? <span className="block text-[11px] text-slate-400">{l.category}</span> : null}
                  </td>
                  <td className="py-2 text-center">{l.qty}</td>
                  <td className="py-2 text-right">{l.unitPrice.toLocaleString("tr-TR")} ₺</td>
                  <td className="py-2 text-right font-semibold">{l.total.toLocaleString("tr-TR")} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <Row label="Ara Toplam" value={`${subtotal.toLocaleString("tr-TR")} ₺`} />
              {discount > 0 && <Row label="İndirim" value={`-${discount.toLocaleString("tr-TR")} ₺`} />}
              <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
                <span>Genel Toplam</span>
                <span>{grand.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p className="mb-1 font-semibold text-slate-700">Notlar</p>
            <p>{quote.notes || "Fiyatlara kurulum ve toplama dahildir. Teklif 7 gün geçerlidir."}</p>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Bu teklif Konsept Stüdyo simülasyon programı ile oluşturulmuştur.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
