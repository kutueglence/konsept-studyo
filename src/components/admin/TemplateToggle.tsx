"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TemplateToggle({ id, value }: { id: number; value: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      className={`chip ${on ? "chip-active" : ""}`}
      onClick={async () => {
        setBusy(true);
        const next = !on;
        await fetch(`/api/designs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTemplate: next }),
        });
        setOn(next);
        setBusy(false);
        router.refresh();
      }}
    >
      {on ? "✨ Hazır" : "○ Normal"}
    </button>
  );
}
