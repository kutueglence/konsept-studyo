"use client";

import { useCallback, useEffect, useState } from "react";

interface CategoryNode {
  id: number;
  name: string;
  icon: string;
  subs: { id: number; name: string }[];
}

export default function KategorilerPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [subName, setSubName] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const r = await fetch("/api/categories", { cache: "no-store" }).then((res) => res.json());
    setCategories(r.categories ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCategory = async () => {
    if (!name.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    setName("");
    load();
  };

  const addSub = async (categoryId: number) => {
    const value = subName[categoryId]?.trim();
    if (!value) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sub", categoryId, name: value }),
    });
    setSubName((s) => ({ ...s, [categoryId]: "" }));
    load();
  };

  const rename = async (id: number, current: string, type?: "sub") => {
    const value = prompt("Yeni isim", current);
    if (!value) return;
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value, type }),
    });
    load();
  };

  const remove = async (id: number, type?: "sub") => {
    if (!confirm(type ? "Alt kategori silinsin mi?" : "Kategori ve alt kategorileri silinsin mi?")) return;
    await fetch(`/api/categories/${id}${type ? "?type=sub" : ""}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kategoriler</h1>
        <p className="text-sm text-slate-500">Katalog yapınızı kategori ve alt kategorilerle düzenleyin.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-5">
        <label className="block w-24">
          <span className="label">İkon</span>
          <input className="input text-center" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </label>
        <label className="block flex-1">
          <span className="label">Yeni Kategori Adı</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Tahta Süsleri" />
        </label>
        <button className="btn-primary" onClick={addCategory}>
          ➕ Kategori Ekle
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                {c.icon} {c.name}
              </h3>
              <div className="flex gap-1">
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => rename(c.id, c.name)}>
                  ✎
                </button>
                <button className="btn-danger px-2 py-1 text-xs" onClick={() => remove(c.id)}>
                  🗑
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.subs.map((s) => (
                <span key={s.id} className="chip">
                  {s.name}
                  <button className="ml-1 text-slate-400 hover:text-indigo-600" onClick={() => rename(s.id, s.name, "sub")}>
                    ✎
                  </button>
                  <button className="text-slate-400 hover:text-rose-600" onClick={() => remove(s.id, "sub")}>
                    ✕
                  </button>
                </span>
              ))}
              {c.subs.length === 0 && <span className="text-xs text-slate-400">Alt kategori yok</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input"
                placeholder="Alt kategori adı"
                value={subName[c.id] ?? ""}
                onChange={(e) => setSubName((s) => ({ ...s, [c.id]: e.target.value }))}
              />
              <button className="btn-soft whitespace-nowrap text-xs" onClick={() => addSub(c.id)}>
                + Ekle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
