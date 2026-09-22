"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProductGlyph, { SHAPE_OPTIONS } from "@/components/ProductGlyph";
import { PALETTES } from "@/lib/palettes";
import type { Product } from "@/db/schema";

interface CategoryNode {
  id: number;
  name: string;
  icon: string;
  subs: { id: number; name: string }[];
}

type FormState = {
  id?: number;
  name: string;
  categoryId: string;
  subcategoryId: string;
  shape: string;
  width: string;
  height: string;
  depth: string;
  color: string;
  colorEditable: boolean;
  material: string;
  price: string;
  stock: string;
  description: string;
  plane: string;
  tags: string;
  imageUrl: string;
  modelUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  categoryId: "",
  subcategoryId: "",
  shape: "balon",
  width: "50",
  height: "50",
  depth: "10",
  color: "#F9D5E5",
  colorEditable: true,
  material: "",
  price: "0",
  stock: "1",
  description: "",
  plane: "wall",
  tags: "",
  imageUrl: "",
  modelUrl: "",
  isActive: true,
};

export default function UrunlerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      fetch("/api/products?all=1", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setProducts(p.products ?? []);
    setCategories(c.categories ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subs = useMemo(
    () => categories.find((c) => String(c.id) === form.categoryId)?.subs ?? [],
    [categories, form.categoryId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return products.filter((p) => {
      if (filterCat && String(p.categoryId) !== filterCat) return false;
      if (!q) return true;
      return p.name.toLocaleLowerCase("tr").includes(q);
    });
  }, [products, query, filterCat]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      setMsg("Ürün adı zorunludur.");
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      subcategoryId: form.subcategoryId || null,
      width: Number(form.width),
      height: Number(form.height),
      depth: Number(form.depth),
      price: Number(form.price),
      stock: Number(form.stock),
    };
    const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      setMsg(form.id ? "Ürün güncellendi ✓" : "Ürün eklendi ✓");
      setForm(emptyForm);
      load();
    } else {
      setMsg("İşlem başarısız.");
    }
  };

  const edit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId ? String(p.categoryId) : "",
      subcategoryId: p.subcategoryId ? String(p.subcategoryId) : "",
      shape: p.shape,
      width: String(p.width),
      height: String(p.height),
      depth: String(p.depth),
      color: p.color,
      colorEditable: p.colorEditable,
      material: p.material ?? "",
      price: String(p.price),
      stock: String(p.stock),
      description: p.description ?? "",
      plane: p.plane,
      tags: p.tags ?? "",
      imageUrl: p.imageUrl ?? "",
      modelUrl: p.modelUrl ?? "",
      isActive: p.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!confirm("Ürün silinsin mi?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const onImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => set("imageUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ürünler</h1>
          <p className="text-sm text-slate-500">Katalog tamamen dinamiktir; ürünlerinizi burada yönetin.</p>
        </div>
        {msg && <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">{msg}</span>}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-800">
          {form.id ? `Ürünü Düzenle #${form.id}` : "Yeni Ürün Ekle"}
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <L label="Ürün Adı" className="md:col-span-2">
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </L>
          <L label="Kategori">
            <select
              className="input"
              value={form.categoryId}
              onChange={(e) => {
                set("categoryId", e.target.value);
                set("subcategoryId", "");
              }}
            >
              <option value="">Seçiniz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </L>
          <L label="Alt Kategori">
            <select className="input" value={form.subcategoryId} onChange={(e) => set("subcategoryId", e.target.value)}>
              <option value="">Seçiniz</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </L>

          <L label="Genişlik (cm)">
            <input className="input" type="number" value={form.width} onChange={(e) => set("width", e.target.value)} />
          </L>
          <L label="Yükseklik (cm)">
            <input className="input" type="number" value={form.height} onChange={(e) => set("height", e.target.value)} />
          </L>
          <L label="Derinlik (cm)">
            <input className="input" type="number" value={form.depth} onChange={(e) => set("depth", e.target.value)} />
          </L>
          <L label="Yerleşim Düzlemi">
            <select className="input" value={form.plane} onChange={(e) => set("plane", e.target.value)}>
              <option value="wall">Duvar</option>
              <option value="floor">Zemin</option>
              <option value="ceiling">Tavan</option>
            </select>
          </L>

          <L label="Kiralama Fiyatı (₺)">
            <input className="input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </L>
          <L label="Stok / Adet">
            <input className="input" type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </L>
          <L label="Malzeme">
            <input className="input" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="MDF, Pleksi, Lateks..." />
          </L>
          <L label="Etiketler">
            <input className="input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="pastel, gold, unicorn" />
          </L>

          <L label="Şekil (görsel yoksa)">
            <select className="input" value={form.shape} onChange={(e) => set("shape", e.target.value)}>
              {SHAPE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </L>
          <L label="Renk">
            <div className="flex gap-2">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                value={/^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#cccccc"}
                onChange={(e) => set("color", e.target.value)}
              />
              <input className="input" value={form.color} onChange={(e) => set("color", e.target.value)} />
            </div>
          </L>
          <L label="Görsel Yükle (PNG/JPG)">
            <input
              type="file"
              accept="image/*"
              className="input py-1.5 text-xs"
              onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])}
            />
          </L>
          <L label="3D Model Bağlantısı (.glb)">
            <input className="input" value={form.modelUrl} onChange={(e) => set("modelUrl", e.target.value)} placeholder="https://..." />
          </L>

          <L label="Açıklama" className="md:col-span-3">
            <input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </L>
          <div className="flex items-end gap-2">
            <button className={`chip ${form.colorEditable ? "chip-active" : ""}`} onClick={() => set("colorEditable", !form.colorEditable)}>
              🎨 Rengi değiştirilebilir
            </button>
            <button className={`chip ${form.isActive ? "chip-active" : ""}`} onClick={() => set("isActive", !form.isActive)}>
              {form.isActive ? "Aktif" : "Pasif"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="önizleme" className="h-full w-full object-contain" />
            ) : (
              <ProductGlyph shape={form.shape} color={form.color} style={{ width: "80%", height: "80%" }} />
            )}
          </div>
          <div className="flex flex-1 flex-wrap gap-1">
            {PALETTES.flatMap((p) => p.colors)
              .slice(0, 24)
              .map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className="h-6 w-6 rounded-md border border-slate-200"
                  style={{ background: c }}
                />
              ))}
          </div>
          {form.imageUrl && (
            <button className="btn-ghost text-xs" onClick={() => set("imageUrl", "")}>
              Görseli kaldır
            </button>
          )}
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {form.id ? "💾 Güncelle" : "➕ Ürünü Ekle"}
          </button>
          {form.id && (
            <button className="btn-soft" onClick={() => setForm(emptyForm)}>
              Vazgeç
            </button>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="input max-w-xs" placeholder="🔍 Ürün ara" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input max-w-xs" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <span className="ml-auto self-center text-xs text-slate-500">{filtered.length} ürün</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
                <th className="py-2">Görsel</th>
                <th className="py-2">Ürün</th>
                <th className="py-2">Kategori</th>
                <th className="py-2">Ölçü (cm)</th>
                <th className="py-2 text-right">Fiyat</th>
                <th className="py-2 text-center">Stok</th>
                <th className="py-2 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                return (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                        ) : (
                          <ProductGlyph shape={p.shape} color={p.color} style={{ width: "80%", height: "80%" }} />
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      {!p.isActive && <span className="ml-2 rounded bg-slate-100 px-1.5 text-[10px]">pasif</span>}
                      <span className="block text-[11px] text-slate-400">{p.material}</span>
                    </td>
                    <td className="py-2 text-xs text-slate-600">{cat ? `${cat.icon} ${cat.name}` : "—"}</td>
                    <td className="py-2 text-xs text-slate-600">
                      {p.width}×{p.height}×{p.depth}
                    </td>
                    <td className="py-2 text-right font-semibold">{p.price.toLocaleString("tr-TR")} ₺</td>
                    <td className="py-2 text-center">{p.stock}</td>
                    <td className="py-2 text-right">
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => edit(p)}>
                        ✎
                      </button>
                      <button className="btn-danger px-2 py-1 text-xs" onClick={() => remove(p.id)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Ürün bulunamadı. Yukarıdaki formdan ilk ürününüzü ekleyin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function L({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
