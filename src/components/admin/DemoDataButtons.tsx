"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DemoDataButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (method: "POST" | "DELETE") => {
    if (method === "DELETE" && !confirm("Katalogdaki TÜM ürünler silinecek. Emin misiniz?")) return;
    setBusy(true);
    const res = await fetch("/api/products/demo", { method });
    const json = await res.json();
    setMsg(method === "POST" ? `${json.inserted ?? 0} demo ürün eklendi.` : "Katalog temizlendi.");
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button className="btn-soft text-xs" disabled={busy} onClick={() => run("POST")}>
        ⚡ Demo ürün paketi yükle
      </button>
      <button className="btn-danger text-xs" disabled={busy} onClick={() => run("DELETE")}>
        🗑 Tüm ürünleri sil
      </button>
      {msg && <span className="text-xs text-emerald-600">{msg}</span>}
    </div>
  );
}
