"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuoteActions({
  quoteId,
  phone,
  summary,
}: {
  quoteId: number;
  phone: string;
  summary: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: string) => {
    setBusy(true);
    await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  };

  const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(summary)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-soft text-sm" disabled={busy} onClick={() => setStatus("gönderildi")}>
        📨 Gönderildi
      </button>
      <button className="btn-soft text-sm" disabled={busy} onClick={() => setStatus("onaylandı")}>
        ✅ Onaylandı
      </button>
      {phone && (
        <a className="btn-outline text-sm" href={wa} target="_blank" rel="noreferrer">
          💬 WhatsApp
        </a>
      )}
      <button className="btn-primary text-sm" onClick={() => window.print()}>
        🖨 PDF / Yazdır
      </button>
    </div>
  );
}
