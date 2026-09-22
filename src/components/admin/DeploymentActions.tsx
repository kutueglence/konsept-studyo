"use client";

import { useState } from "react";

export default function DeploymentDownload() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/deployment/source", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Paket indirilemedi. Lütfen tekrar deneyin.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "konsept-studyo-yayin-paketi.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMessage("Paket hazır. ZIP'i açın ve içindeki DEPLOYMENT.md rehberini takip edin.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İndirme sırasında bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn-primary px-5 py-3" onClick={download} disabled={busy}>
        {busy ? "Paket hazırlanıyor…" : "↓ Yayın paketini indir (.zip)"}
      </button>
      {message && <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-600" role="status">{message}</p>}
    </div>
  );
}

export function CopyCommand({ command }: { command: string }) {
  const [message, setMessage] = useState("");
  return (
    <div className="mt-3 rounded-xl bg-slate-900 p-3 text-slate-100">
      <div className="flex items-center gap-3">
        <code className="min-w-0 flex-1 break-all text-xs leading-relaxed">{command}</code>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(command);
              setMessage("Kopyalandı");
            } catch { setMessage("Metni seçerek kopyalayabilirsiniz."); }
            window.setTimeout(() => setMessage(""), 2500);
          }}
        >
          Kopyala
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-300" role="status">{message}</p>}
    </div>
  );
}
