"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDesignButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-danger px-2 py-1.5 text-xs"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Bu konsept silinsin mi?")) return;
        setBusy(true);
        await fetch(`/api/designs/${id}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
    >
      🗑
    </button>
  );
}
