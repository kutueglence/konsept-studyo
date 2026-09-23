"use client";

import { useMemo, useState } from "react";
import ProductGlyph from "@/components/ProductGlyph";
import ImageUploadTab from "./ImageUploadTab";
import { useEditor } from "@/lib/editor/store";
import { PALETTES, FONT_OPTIONS } from "@/lib/palettes";
import { isBackdropCategoryName } from "@/lib/editor/backdrop";
import {
  WALL_PATTERN_OPTIONS,
  type WallPatternConfig,
  type WallPatternType,
} from "@/lib/editor/wall-pattern";
import type { Product } from "@/db/schema";
import type { SceneItem } from "@/lib/types";

export interface CategoryNode {
  id: number;
  name: string;
  icon: string;
  subs: { id: number; name: string }[];
}

export interface TemplateSummary {
  id: number;
  name: string;
  eventType: string | null;
  total: number;
  coverColor: string;
  items: SceneItem[];
  room: Record<string, unknown>;
}

interface Props {
  products: Product[];
  categories: CategoryNode[];
  loading: boolean;
  templates: TemplateSummary[];
  onAddProduct: (p: Product) => void;
  onApplyTemplate: (t: TemplateSummary) => void;
}

const TEXT_PRESETS = [
  "İYİ Kİ DOĞDUN",
  "HAPPY BIRTHDAY",
  "MUTLU YILLAR",
  "1 YAŞINDA",
  "5 YAŞINDA",
  "OH BABY",
  "IT'S A GIRL",
  "IT'S A BOY",
  "HOŞ GELDİN",
];

type Tab = "katalog" | "gorsel" | "yazi" | "alan" | "hazir";

export default function LeftPanel({
  products,
  categories,
  loading,
  templates,
  onAddProduct,
  onApplyTemplate,
}: Props) {
  const [tab, setTab] = useState<Tab>("katalog");
  const [query, setQuery] = useState("");
  const [catId, setCatId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [onlyStock, setOnlyStock] = useState(false);

  const room = useEditor((s) => s.room);
  const setRoom = useEditor((s) => s.setRoom);
  const addText = useEditor((s) => s.addText);
  const addCustomImage = useEditor((s) => s.addCustomImage);

  const [customText, setCustomText] = useState("ELİF");
  const [textColor, setTextColor] = useState("#d4af37");
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return products.filter((p) => {
      if (catId && p.categoryId !== catId) return false;
      if (subId && p.subcategoryId !== subId) return false;
      if (onlyStock && p.stock <= 0) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (!q) return true;
      return (
        p.name.toLocaleLowerCase("tr").includes(q) ||
        (p.material ?? "").toLocaleLowerCase("tr").includes(q) ||
        (p.tags ?? "").toLocaleLowerCase("tr").includes(q) ||
        (p.description ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [products, query, catId, subId, onlyStock, maxPrice]);

  const activeCat = categories.find((c) => c.id === catId);
  const backdropCatIds = useMemo(
    () => new Set(categories.filter((c) => isBackdropCategoryName(c.name)).map((c) => c.id)),
    [categories],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 gap-1 border-b border-slate-200 px-2 pt-2">
        {(
          [
            ["katalog", "Katalog"],
            ["gorsel", "Görsel"],
            ["yazi", "Yazı"],
            ["alan", "Alan"],
            ["hazir", "Hazır"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition ${
              tab === key ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "katalog" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-2 border-b border-slate-100 p-3">
            <input
              className="input"
              placeholder="🔍 Ürün ara (isim, malzeme, etiket)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Maks. fiyat ₺"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
              />
              <button
                onClick={() => setOnlyStock((v) => !v)}
                className={`chip whitespace-nowrap ${onlyStock ? "chip-active" : ""}`}
              >
                Stokta
              </button>
            </div>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              <button
                onClick={() => {
                  setCatId(null);
                  setSubId(null);
                }}
                className={`chip ${catId === null ? "chip-active" : ""}`}
              >
                Tümü
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCatId(c.id === catId ? null : c.id);
                    setSubId(null);
                  }}
                  className={`chip ${catId === c.id ? "chip-active" : ""}`}
                >
                  <span>{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
            {activeCat && activeCat.subs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeCat.subs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSubId(sub.id === subId ? null : sub.id)}
                    className={`chip ${subId === sub.id ? "chip-active" : ""}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Katalog yükleniyor…</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                <p className="mb-2 text-3xl">📦</p>
                <p className="font-medium text-slate-700">Ürün bulunamadı</p>
                <p className="mt-1 text-xs">
                  Ürünlerinizi <a className="text-indigo-600 underline" href="/yonetim/urunler">Yönetici Paneli → Ürünler</a> bölümünden ekleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-product", String(p.id));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onAddProduct(p)}
                    title={`${p.name} — sürükleyip bırakın veya tıklayın`}
                    className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                      ) : (
                        <ProductGlyph shape={p.shape} color={p.color} style={{ width: "78%", height: "78%" }} />
                      )}
                    </div>
                    <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700">
                      {p.name}
                    </span>
                    {backdropCatIds.has(p.categoryId ?? -1) && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                        Arka fon · otomatik yerleşir
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      {p.width}×{p.height} cm
                    </span>
                    <span className="text-[12px] font-bold text-indigo-600">
                      {p.price.toLocaleString("tr-TR")} ₺
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "gorsel" && (
        <ImageUploadTab addCustomImage={addCustomImage} />
      )}

      {tab === "yazi" && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div>
            <span className="label">Hazır Yazılar</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_PRESETS.map((t) => (
                <button
                  key={t}
                  className="chip"
                  onClick={() =>
                    addText({ text: t, color: textColor, fontFamily, width: Math.max(60, t.length * 18) })
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Özel Yazı</span>
            <input className="input" value={customText} onChange={(e) => setCustomText(e.target.value)} />
          </div>
          <div>
            <span className="label">Yazı Tipi</span>
            <select className="input" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Renk</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
              <input className="input" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </div>
          </div>
          <button
            className="btn-primary w-full"
            onClick={() =>
              addText({
                text: customText || "Yazı",
                color: textColor,
                fontFamily,
                width: Math.max(60, (customText || "Yazı").length * 18),
              })
            }
          >
            ➕ Sahneye Yazı Ekle
          </button>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Yazıyı ekledikten sonra sağ panelden boyut, kalınlık, harf aralığı, döndürme ve neon
            parlaklığı ayarlarını değiştirebilirsiniz.
          </p>
        </div>
      )}

      {tab === "alan" && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Duvar Genişliği (cm)" value={room.wallWidth} onChange={(v) => setRoom({ wallWidth: v })} />
            <NumberField label="Duvar Yüksekliği (cm)" value={room.wallHeight} onChange={(v) => setRoom({ wallHeight: v })} />
            <NumberField label="Zemin Derinliği (cm)" value={room.floorDepth} onChange={(v) => setRoom({ floorDepth: v })} />
            <NumberField label="Snap Adımı (cm)" value={room.snapSize} onChange={(v) => setRoom({ snapSize: Math.max(1, v) })} />
          </div>

          <ColorField label="Duvar Rengi" value={room.wallColor} onChange={(v) => setRoom({ wallColor: v, wallColor2: v })} />
          <ColorField label="Duvar Gölge Tonu" value={room.wallColor2} onChange={(v) => setRoom({ wallColor2: v })} />
          <ColorField label="Zemin Rengi" value={room.floorColor} onChange={(v) => setRoom({ floorColor: v })} />
          <ColorField label="Tavan Rengi" value={room.ceilingColor} onChange={(v) => setRoom({ ceilingColor: v })} />
          <ColorField label="Arka Plan" value={room.backgroundColor} onChange={(v) => setRoom({ backgroundColor: v })} />

          <div>
            <span className="label">Ortam Işığı</span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.01}
              value={room.ambientLight}
              onChange={(e) => setRoom({ ambientLight: Number(e.target.value) }, false)}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Toggle label="Tavan" active={room.showCeiling} onClick={() => setRoom({ showCeiling: !room.showCeiling })} />
            <Toggle label="Izgara" active={room.gridVisible} onClick={() => setRoom({ gridVisible: !room.gridVisible })} />
            <Toggle label="Snap" active={room.snapEnabled} onClick={() => setRoom({ snapEnabled: !room.snapEnabled })} />
          </div>

          <div>
            <span className="label">Hazır Renk Paletleri</span>
            <div className="space-y-2">
              {PALETTES.map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] font-medium text-slate-600">{p.name}</span>
                  <div className="flex flex-1 gap-1">
                    {p.colors.map((c) => (
                      <button
                        key={c}
                        title={`Duvar rengi: ${c}`}
                        onClick={() => setRoom({ wallColor: c, wallColor2: c })}
                        className="h-6 flex-1 rounded-md border border-slate-200"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "hazir" && (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              <p className="mb-2 text-3xl">✨</p>
              Henüz hazır konsept yok. Yönetici panelinden bir tasarımı “hazır konsept” olarak
              kaydedebilirsiniz.
            </div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onApplyTemplate(t)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2 text-left transition hover:border-indigo-300 hover:shadow-sm"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ background: t.coverColor }}
                >
                  🎉
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{t.name}</span>
                  <span className="block text-[11px] text-slate-500">
                    {t.eventType ?? "Konsept"} · {t.items.length} ürün · {t.total.toLocaleString("tr-TR")} ₺
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function WallPatternSection() {
  const room = useEditor((s) => s.room);
  const setRoom = useEditor((s) => s.setRoom);
  const pattern = room.wallPattern;

  const setPattern = (patch: Partial<WallPatternConfig>) =>
    setRoom({ wallPattern: { ...pattern, ...patch } });

  const selectType = (value: WallPatternType) => {
    const preset = WALL_PATTERN_OPTIONS.find((o) => o.value === value);
    setRoom({
      wallPattern: {
        ...pattern,
        type: value,
        spacing: preset?.spacing ?? pattern.spacing,
        thickness: preset?.thickness ?? pattern.thickness,
      },
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Duvar Tipi &amp; Desen
      </h3>
      <div className="grid grid-cols-2 gap-1.5">
        {WALL_PATTERN_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => selectType(o.value)}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition ${
              pattern.type === o.value
                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">
              {o.icon}
            </span>
            <span className="min-w-0 truncate">{o.label}</span>
          </button>
        ))}
      </div>

      {pattern.type !== "duz" && (
        <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Desen Aralığı (cm)"
              value={pattern.spacing}
              onChange={(v) => setPattern({ spacing: Math.max(2, Math.min(300, v)) })}
            />
            <NumberField
              label={pattern.type === "puantiye" ? "Nokta Kalınlığı (cm)" : "Çizgi Kalınlığı (cm)"}
              value={pattern.thickness}
              onChange={(v) => setPattern({ thickness: Math.max(0.2, Math.min(60, v)) })}
            />
          </div>
          <ColorField
            label={pattern.type === "tugla" ? "Derz Rengi" : "Desen Rengi"}
            value={pattern.color}
            onChange={(v) => setPattern({ color: v })}
          />
          <div>
            <span className="label">Belirginlik %{Math.round(pattern.strength * 100)}</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={pattern.strength}
              onChange={(e) => setPattern({ strength: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Desen gerçek santimetreyle çizilir; yakınlaştırdığınızda duvarla birlikte büyür,
            mavi ızgaradan bağımsızdır ve konsept kaydedildiğinde birlikte saklanır.
          </p>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
        />
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`chip ${active ? "chip-active" : ""}`}>
      {active ? "✓" : "○"} {label}
    </button>
  );
}
