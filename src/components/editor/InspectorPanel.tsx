"use client";

import { useEditor, type AlignMode } from "@/lib/editor/store";
import { PALETTES, FONT_OPTIONS } from "@/lib/palettes";
import type { SceneItem, TextSceneItem } from "@/lib/types";

const ALIGN_BUTTONS: { mode: AlignMode; label: string; icon: string }[] = [
  { mode: "left", label: "Sola hizala", icon: "⇤" },
  { mode: "centerX", label: "Yatay ortala", icon: "↔" },
  { mode: "right", label: "Sağa hizala", icon: "⇥" },
  { mode: "top", label: "Yukarı hizala", icon: "⇧" },
  { mode: "centerY", label: "Dikey ortala", icon: "↕" },
  { mode: "bottom", label: "Aşağı hizala", icon: "⇩" },
  { mode: "wallCenter", label: "Duvar merkezi", icon: "▣" },
  { mode: "floor", label: "Zemine otur", icon: "⤓" },
];

export default function InspectorPanel() {
  const items = useEditor((s) => s.items);
  const selectedIds = useEditor((s) => s.selectedIds);
  const updateItems = useEditor((s) => s.updateItems);
  const deleteItems = useEditor((s) => s.deleteItems);
  const duplicateItems = useEditor((s) => s.duplicateItems);
  const reorder = useEditor((s) => s.reorder);
  const align = useEditor((s) => s.align);
  const distribute = useEditor((s) => s.distribute);
  const select = useEditor((s) => s.select);

  const selected = items.filter((i) => selectedIds.includes(i.id));
  const single: SceneItem | undefined = selected.length === 1 ? selected[0] : undefined;
  const patch = (p: Partial<SceneItem>, history = true) => updateItems(selectedIds, p, history);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {selected.length === 0
            ? "Özellikler"
            : selected.length === 1
              ? single?.name
              : `${selected.length} nesne seçili`}
        </h2>
        <p className="text-[11px] text-slate-500">
          {selected.length === 0 ? "Bir nesne seçin ya da katalogdan ürün ekleyin" : "Seçimi düzenleyin"}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {selected.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5">
              <button className="btn-soft px-2 py-1.5 text-xs" onClick={() => duplicateItems(selectedIds)}>
                ⧉ Çoğalt
              </button>
              <button className="btn-soft px-2 py-1.5 text-xs" onClick={() => reorder(selectedIds, "front")}>
                ⬆ Öne getir
              </button>
              <button className="btn-soft px-2 py-1.5 text-xs" onClick={() => reorder(selectedIds, "back")}>
                ⬇ Arkaya gönder
              </button>
              <button className="btn-soft px-2 py-1.5 text-xs" onClick={() => reorder(selectedIds, "forward")}>
                +1 Katman
              </button>
              <button className="btn-soft px-2 py-1.5 text-xs" onClick={() => reorder(selectedIds, "backward")}>
                -1 Katman
              </button>
              <button className="btn-danger px-2 py-1.5 text-xs" onClick={() => deleteItems(selectedIds)}>
                🗑 Sil
              </button>
            </div>

            <Section title="Hizalama">
              <div className="grid grid-cols-4 gap-1.5">
                {ALIGN_BUTTONS.map((b) => (
                  <button
                    key={b.mode}
                    title={b.label}
                    onClick={() => align(selectedIds, b.mode)}
                    className="rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  className="btn-outline flex-1 px-2 py-1.5 text-xs"
                  onClick={() => distribute(selectedIds, "x")}
                  disabled={selected.length < 3}
                >
                  Yatay eşit dağıt
                </button>
                <button
                  className="btn-outline flex-1 px-2 py-1.5 text-xs"
                  onClick={() => distribute(selectedIds, "y")}
                  disabled={selected.length < 3}
                >
                  Dikey eşit dağıt
                </button>
              </div>
            </Section>
          </>
        )}

        {single && (
          <>
            <Section title="Konum & Boyut">
              <div className="grid grid-cols-2 gap-2">
                <Num label="X (cm)" value={round(single.x)} onChange={(v) => patch({ x: v })} />
                <Num label="Y (cm)" value={round(single.y)} onChange={(v) => patch({ y: v })} />
                <Num label="Derinlik Z (cm)" value={round(single.z)} onChange={(v) => patch({ z: v })} />
                <Num label="Döndürme (°)" value={round(single.rotation)} onChange={(v) => patch({ rotation: v })} />
                <Num label="Genişlik (cm)" value={round(single.width)} onChange={(v) => patch({ width: Math.max(1, v) })} />
                <Num label="Yükseklik (cm)" value={round(single.height)} onChange={(v) => patch({ height: Math.max(1, v) })} />
              </div>
              <div className="mt-2">
                <span className="label">Ölçek ×{single.scale.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.1}
                  max={4}
                  step={0.05}
                  value={single.scale}
                  onChange={(e) => patch({ scale: Number(e.target.value) }, false)}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                <button className="btn-soft flex-1 py-1.5 text-xs" onClick={() => patch({ scale: round2(single.scale * 1.1) })}>
                  ➕ Büyüt
                </button>
                <button className="btn-soft flex-1 py-1.5 text-xs" onClick={() => patch({ scale: round2(single.scale / 1.1) })}>
                  ➖ Küçült
                </button>
                <button className="btn-soft flex-1 py-1.5 text-xs" onClick={() => patch({ rotation: round(single.rotation + 15) })}>
                  ⟳ 15°
                </button>
              </div>
              <div className="mt-2">
                <span className="label">Düzlem</span>
                <select
                  className="input"
                  value={single.plane}
                  onChange={(e) => patch({ plane: e.target.value as SceneItem["plane"] })}
                >
                  <option value="wall">Duvar</option>
                  <option value="floor">Zemin</option>
                  <option value="ceiling">Tavan</option>
                </select>
              </div>
            </Section>

            <Section title="Görünüm">
              <span className="label">Renk</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={toHex(single.color)}
                  onChange={(e) => patch({ color: e.target.value }, false)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                />
                <input className="input" value={single.color} onChange={(e) => patch({ color: e.target.value }, false)} />
              </div>
              <div className="mt-2 space-y-1.5">
                {PALETTES.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] font-medium text-slate-500">{p.name}</span>
                    <div className="flex flex-1 gap-1">
                      {p.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => patch({ color: c })}
                          title={c}
                          className="h-5 flex-1 rounded border border-slate-200"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <span className="label">Opaklık %{Math.round(single.opacity * 100)}</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={single.opacity}
                  onChange={(e) => patch({ opacity: Number(e.target.value) }, false)}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <button className={`chip ${single.locked ? "chip-active" : ""}`} onClick={() => patch({ locked: !single.locked })}>
                  {single.locked ? "🔒 Kilitli" : "🔓 Kilitle"}
                </button>
                <button className={`chip ${!single.visible ? "chip-active" : ""}`} onClick={() => patch({ visible: !single.visible })}>
                  {single.visible ? "👁 Görünür" : "🚫 Gizli"}
                </button>
              </div>
            </Section>

            {single.kind === "text" && <TextSection item={single} patch={patch} />}

            <Section title="Kiralama">
              <div className="grid grid-cols-2 gap-2">
                <Num label="Adet" value={single.qty} onChange={(v) => patch({ qty: Math.max(1, Math.round(v)) })} />
                <Num label="Birim Fiyat ₺" value={single.price} onChange={(v) => patch({ price: Math.max(0, v) })} />
              </div>
              <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                Satır toplamı: {(single.price * single.qty).toLocaleString("tr-TR")} ₺
              </p>
            </Section>
          </>
        )}

        <Section title={`Katmanlar (${items.length})`}>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {[...items]
              .sort((a, b) => b.layer - a.layer)
              .map((i) => (
                <button
                  key={i.id}
                  onClick={() => select([i.id])}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                    selectedIds.includes(i.id)
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-sm border border-slate-300" style={{ background: i.color }} />
                  <span className="min-w-0 flex-1 truncate">{i.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">#{Math.round(i.layer)}</span>
                </button>
              ))}
            {items.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Sahne boş</p>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function TextSection({
  item,
  patch,
}: {
  item: TextSceneItem;
  patch: (p: Partial<SceneItem>, history?: boolean) => void;
}) {
  return (
    <Section title="Yazı Ayarları">
      <label className="block">
        <span className="label">Metin</span>
        <input
          className="input"
          value={item.text}
          onChange={(e) =>
            patch(
              {
                text: e.target.value,
                name: e.target.value,
                width: Math.max(40, e.target.value.length * item.fontSize * 0.62),
              } as Partial<SceneItem>,
              false,
            )
          }
        />
      </label>
      <label className="mt-2 block">
        <span className="label">Yazı Tipi</span>
        <select
          className="input"
          value={item.fontFamily}
          onChange={(e) => patch({ fontFamily: e.target.value } as Partial<SceneItem>)}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Num
          label="Yazı Boyutu (cm)"
          value={item.fontSize}
          onChange={(v) =>
            patch(
              {
                fontSize: Math.max(2, v),
                height: Math.max(6, v * 1.3),
                width: Math.max(40, item.text.length * v * 0.62),
              } as Partial<SceneItem>,
              false,
            )
          }
        />
        <Num
          label="Harf Aralığı"
          value={item.letterSpacing}
          onChange={(v) => patch({ letterSpacing: v } as Partial<SceneItem>, false)}
        />
      </div>
      <div className="mt-2">
        <span className="label">Kalınlık: {item.fontWeight}</span>
        <input
          type="range"
          min={300}
          max={900}
          step={100}
          value={item.fontWeight}
          onChange={(e) => patch({ fontWeight: Number(e.target.value) } as Partial<SceneItem>, false)}
          className="w-full accent-indigo-600"
        />
      </div>
      <button
        className={`chip mt-2 ${item.glow ? "chip-active" : ""}`}
        onClick={() => patch({ glow: !item.glow } as Partial<SceneItem>)}
      >
        ✨ Neon Parlaklık
      </button>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const toHex = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#cccccc");
