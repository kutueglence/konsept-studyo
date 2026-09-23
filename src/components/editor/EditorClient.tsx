"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stage from "./Stage";
import LeftPanel, { type CategoryNode, type TemplateSummary } from "./LeftPanel";
import InspectorPanel from "./InspectorPanel";
import { buildMaterialLines, totalCount, totalOf, useEditor } from "@/lib/editor/store";
import { isBackdropCategoryName } from "@/lib/editor/backdrop";
import { DEFAULT_ROOM, EVENT_TYPES, type RoomConfig, type SceneItem } from "@/lib/types";
import type { Product } from "@/db/schema";

interface Props {
  designId?: number;
}

export default function EditorClient({ designId }: Props) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [showList, setShowList] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"none" | "left" | "right">("none");
  const [stamp, setStamp] = useState(false);

  const items = useEditor((s) => s.items);
  const meta = useEditor((s) => s.meta);
  const room = useEditor((s) => s.room);
  const view = useEditor((s) => s.view);
  const camera = useEditor((s) => s.camera);
  const selectedIds = useEditor((s) => s.selectedIds);
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const storeDesignId = useEditor((s) => s.designId);

  const setView = useEditor((s) => s.setView);
  const setCamera = useEditor((s) => s.setCamera);
  const resetCamera = useEditor((s) => s.resetCamera);
  const setMeta = useEditor((s) => s.setMeta);
  const addProduct = useEditor((s) => s.addProduct);
  const addCustomImage = useEditor((s) => s.addCustomImage);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const clearScene = useEditor((s) => s.clearScene);
  const loadDesign = useEditor((s) => s.loadDesign);
  const markSaved = useEditor((s) => s.markSaved);
  const deleteItems = useEditor((s) => s.deleteItems);
  const duplicateItems = useEditor((s) => s.duplicateItems);
  const select = useEditor((s) => s.select);
  const clearSelection = useEditor((s) => s.clearSelection);
  const commit = useEditor((s) => s.commit);
  const moveBy = useEditor((s) => s.moveBy);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* --------------------------------- veri --------------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pRes, cRes, tRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/designs?templates=1", { cache: "no-store" }),
        ]);
        const pJson = await pRes.json();
        const cJson = await cRes.json();
        const tJson = await tRes.json();
        if (!alive) return;
        setProducts(pJson.products ?? []);
        setCategories(cJson.categories ?? []);
        setTemplates(
          (tJson.designs ?? []).map((d: Record<string, unknown>) => ({
            id: d.id as number,
            name: d.name as string,
            eventType: (d.eventType as string) ?? null,
            total: Number(d.total ?? 0),
            coverColor: (d.coverColor as string) ?? "#fde68a",
            items: (d.items as SceneItem[]) ?? [],
            room: (d.room as Record<string, unknown>) ?? {},
          })),
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!designId) return;
    (async () => {
      const res = await fetch(`/api/designs/${designId}`, { cache: "no-store" });
      if (!res.ok) return;
      const { design } = await res.json();
      loadDesign({
        id: design.id,
        meta: {
          name: design.name,
          customerName: design.customerName ?? "",
          customerPhone: design.customerPhone ?? "",
          eventType: design.eventType ?? "Doğum Günü",
          eventDate: design.eventDate ?? "",
          notes: design.notes ?? "",
        },
        room: { ...DEFAULT_ROOM, ...(design.room as RoomConfig) },
        items: (design.items as SceneItem[]) ?? [],
      });
    })();
  }, [designId, loadDesign]);

  /* ------------------------------ kısayollar ------------------------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateItems(useEditor.getState().selectedIds);
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        select(useEditor.getState().items.map((i) => i.id));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const ids = useEditor.getState().selectedIds;
        if (ids.length) {
          e.preventDefault();
          deleteItems(ids);
        }
      } else if (e.key === "Escape") {
        clearSelection();
      } else if (e.key.startsWith("Arrow")) {
        const ids = useEditor.getState().selectedIds;
        if (!ids.length) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        commit();
        if (e.key === "ArrowLeft") moveBy(ids, -step, 0);
        if (e.key === "ArrowRight") moveBy(ids, step, 0);
        if (e.key === "ArrowUp") moveBy(ids, 0, step);
        if (e.key === "ArrowDown") moveBy(ids, 0, -step);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection, commit, deleteItems, duplicateItems, moveBy, redo, select, undo]);

  /* -------------------------------- işlemler ------------------------------- */
  /** "Konsept / Arka Fon Panelleri" kategorisindeki ürünler → otomatik yerleşir. */
  const backdropCategoryIds = useMemo(
    () => new Set(categories.filter((c) => isBackdropCategoryName(c.name)).map((c) => c.id)),
    [categories],
  );
  const isBackdropProduct = useCallback(
    (p: Product) => backdropCategoryIds.has(p.categoryId ?? -1),
    [backdropCategoryIds],
  );

  const handleDropProduct = useCallback(
    ({ productId, x, y }: { productId: number; x: number; y: number }) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      addProduct(product, { x, y }, { backdrop: isBackdropProduct(product) });
    },
    [addProduct, isBackdropProduct, products],
  );

  const handleDropImage = useCallback(
    (file: File, x: number, y: number) => {
      const reader = new FileReader();
      reader.onload = () => {
        addCustomImage(String(reader.result), file.name.replace(/\.[^.]+$/, ""), 80, 80, { x, y });
      };
      reader.readAsDataURL(file);
    },
    [addCustomImage],
  );

  const applyTemplate = useCallback(
    (t: TemplateSummary) => {
      loadDesign({
        id: null,
        meta: { ...useEditor.getState().meta, name: `${t.name} (kopya)` },
        room: { ...DEFAULT_ROOM, ...(t.room as unknown as Partial<RoomConfig>) },
        items: t.items.map((i) => ({ ...i, id: `it_${Math.random().toString(36).slice(2, 10)}` })),
      });
      notify("Hazır konsept sahneye yüklendi.");
    },
    [loadDesign, notify],
  );

  const capturePng = useCallback(async (pixelRatio = 2) => {
    const node = stageRef.current;
    if (!node) return null;
    const { toPng } = await import("html-to-image");
    return toPng(node, { pixelRatio, cacheBust: true, backgroundColor: useEditor.getState().room.backgroundColor });
  }, []);

  const handleExportImage = useCallback(async () => {
    setStamp(true);
    await new Promise((r) => setTimeout(r, 120));
    try {
      const url = await capturePng(2.5);
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.name || "konsept"}.png`;
      a.click();
      notify("Görsel indirildi.");
    } catch {
      notify("Görsel oluşturulamadı.");
    } finally {
      setStamp(false);
    }
  }, [capturePng, meta.name, notify]);

  const saveDesign = useCallback(
    async (opts?: { silent?: boolean; isTemplate?: boolean }) => {
      setSaving(true);
      try {
        const state = useEditor.getState();
        const payload = {
          name: state.meta.name || "İsimsiz Konsept",
          customerName: state.meta.customerName,
          customerPhone: state.meta.customerPhone,
          eventType: state.meta.eventType,
          eventDate: state.meta.eventDate,
          notes: state.meta.notes,
          room: state.room,
          items: state.items,
          total: totalOf(state.items),
          isTemplate: opts?.isTemplate ?? false,
        };
        const id = state.designId;
        const res = await fetch(id ? `/api/designs/${id}` : "/api/designs", {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.design?.id) markSaved(json.design.id);
        if (!opts?.silent) notify("Konsept kaydedildi ✓");
        return json.design?.id as number | undefined;
      } catch {
        notify("Kaydetme başarısız.");
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [markSaved, notify],
  );

  const createQuote = useCallback(async () => {
    setSaving(true);
    try {
      const designIdSaved = await saveDesign({ silent: true });
      let previewImg: string | null = null;
      try {
        previewImg = await capturePng(1.4);
      } catch {
        previewImg = null;
      }
      const state = useEditor.getState();
      const lines = buildMaterialLines(state.items);
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: designIdSaved ?? state.designId,
          customerName: state.meta.customerName,
          customerPhone: state.meta.customerPhone,
          eventType: state.meta.eventType,
          eventDate: state.meta.eventDate,
          conceptName: state.meta.name,
          notes: state.meta.notes,
          lines,
          total: totalOf(state.items),
          preview: previewImg,
        }),
      });
      const json = await res.json();
      if (json.quote?.id) router.push(`/teklif/${json.quote.id}`);
    } catch {
      notify("Teklif oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }, [capturePng, notify, router, saveDesign]);

  const total = totalOf(items);
  const count = totalCount(items);
  const lines = buildMaterialLines(items);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      {/* ------------------------------- üst bar ------------------------------ */}
      <header className="z-30 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <Link href="/" className="flex items-center gap-2 pr-2">
          <span className="text-xl">🎈</span>
          <span className="hidden text-sm font-bold text-slate-800 sm:block">Konsept Stüdyo</span>
        </Link>

        <input
          className="input h-9 max-w-[200px] flex-1 sm:max-w-[260px]"
          value={meta.name}
          onChange={(e) => setMeta({ name: e.target.value })}
          placeholder="Konsept adı"
        />

        <div className="ml-1 flex rounded-xl bg-slate-100 p-0.5">
          {(["2d", "3d"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <IconBtn title="Geri Al (Ctrl+Z)" onClick={undo} disabled={!past.length}>
            ↺
          </IconBtn>
          <IconBtn title="İleri Al (Ctrl+Y)" onClick={redo} disabled={!future.length}>
            ↻
          </IconBtn>
          <IconBtn title="Uzaklaştır" onClick={() => setCamera({ zoom: Math.max(0.3, camera.zoom - 0.1) })}>
            −
          </IconBtn>
          <IconBtn title="Yakınlaştır" onClick={() => setCamera({ zoom: Math.min(3, camera.zoom + 0.1) })}>
            +
          </IconBtn>
          <IconBtn title="Kamerayı sıfırla" onClick={resetCamera}>
            ⌖
          </IconBtn>
          {view === "3d" && (
            <>
              <IconBtn title="Sola döndür" onClick={() => setCamera({ yaw: Math.max(-55, camera.yaw - 8) })}>
                ◀
              </IconBtn>
              <IconBtn title="Sağa döndür" onClick={() => setCamera({ yaw: Math.min(55, camera.yaw + 8) })}>
                ▶
              </IconBtn>
              <IconBtn title="Yukarı" onClick={() => setCamera({ pitch: Math.min(45, camera.pitch + 6) })}>
                ▲
              </IconBtn>
              <IconBtn title="Aşağı" onClick={() => setCamera({ pitch: Math.max(-25, camera.pitch - 6) })}>
                ▼
              </IconBtn>
            </>
          )}
          <IconBtn title="Sahneyi temizle" onClick={() => clearScene()}>
            🧹
          </IconBtn>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/konseptler" className="btn-ghost hidden px-2 py-1.5 text-xs md:inline-flex">
            Kayıtlı Konseptler
          </Link>
          <Link href="/yonetim" className="btn-outline px-2.5 py-1.5 text-xs">
            ⚙️ <span className="hidden sm:inline">Yönetim</span>
          </Link>
        </div>
      </header>

      {/* -------------------------------- gövde ------------------------------- */}
      <div className="relative flex min-h-0 flex-1">
        <aside
          className={`absolute inset-y-0 left-0 z-20 w-[300px] border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
            mobilePanel === "left" ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          } ${preview ? "md:hidden" : ""}`}
        >
          <LeftPanel
            products={products}
            categories={categories}
            loading={loading}
            templates={templates}
            onAddProduct={(p) => {
              addProduct(p, undefined, { backdrop: isBackdropProduct(p) });
              setMobilePanel("none");
            }}
            onApplyTemplate={(t) => {
              applyTemplate(t);
              setMobilePanel("none");
            }}
          />
        </aside>

        <main className="relative min-w-0 flex-1">
          <Stage
            stageRef={stageRef}
            onDropProduct={handleDropProduct}
            onDropImage={handleDropImage}
            watermark={{
              show: stamp || preview,
              title: meta.name,
              customer: meta.customerName,
              date: meta.eventDate,
            }}
          />

          {selectedIds.length > 0 && (
            <div className="pointer-events-auto absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1 rounded-xl bg-white/95 p-1 shadow-lg ring-1 ring-slate-200">
              <MiniBtn title="Çoğalt (Ctrl+D)" onClick={() => duplicateItems(selectedIds)}>
                ⧉
              </MiniBtn>
              <MiniBtn title="Sil (Del)" onClick={() => deleteItems(selectedIds)}>
                🗑
              </MiniBtn>
              <MiniBtn title="Öne getir" onClick={() => useEditor.getState().reorder(selectedIds, "front")}>
                ⬆
              </MiniBtn>
              <MiniBtn title="Arkaya gönder" onClick={() => useEditor.getState().reorder(selectedIds, "back")}>
                ⬇
              </MiniBtn>
              <MiniBtn title="Duvar merkezine hizala" onClick={() => useEditor.getState().align(selectedIds, "wallCenter")}>
                ▣
              </MiniBtn>
              <MiniBtn title="15° döndür" onClick={() => useEditor.getState().updateItems(selectedIds, { rotation: (items.find((i) => i.id === selectedIds[0])?.rotation ?? 0) + 15 })}>
                ⟳
              </MiniBtn>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] text-slate-500 shadow-sm lg:block">
            {view === "3d"
              ? "Boş alanda sürükle: kamerayı döndür · Shift+sürükle: kaydır · Tekerlek: yakınlaştır"
              : "Boş alanda sürükle: çoklu seçim · Shift+sürükle: kaydır · Tekerlek: yakınlaştır"}
          </div>
        </main>

        <aside
          className={`absolute inset-y-0 right-0 z-20 w-[310px] border-l border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
            mobilePanel === "right" ? "translate-x-0 shadow-2xl" : "translate-x-full"
          } ${preview ? "md:hidden" : ""}`}
        >
          <InspectorPanel />
        </aside>
      </div>

      {/* ------------------------------- alt bar ------------------------------ */}
      <footer className="z-30 flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Toplam Ürün</p>
            <p className="text-sm font-bold text-slate-800">{count} adet</p>
          </div>
          <div className="rounded-xl bg-indigo-50 px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase text-indigo-500">Kiralama Bedeli</p>
            <p className="text-sm font-bold text-indigo-700">{total.toLocaleString("tr-TR")} ₺</p>
          </div>
          <button className="btn-ghost hidden px-2 py-1.5 text-xs sm:inline-flex" onClick={() => setShowList(true)}>
            📋 Malzeme Listesi
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button className="btn-soft px-2.5 py-1.5 text-xs md:hidden" onClick={() => setMobilePanel(mobilePanel === "left" ? "none" : "left")}>
            🗂 Katalog
          </button>
          <button className="btn-soft px-2.5 py-1.5 text-xs md:hidden" onClick={() => setMobilePanel(mobilePanel === "right" ? "none" : "right")}>
            ⚙ Özellik
          </button>
          <button className="btn-soft px-3 py-1.5 text-xs" onClick={() => setPreview((v) => !v)}>
            {preview ? "✎ Düzenle" : "👁 Önizle"}
          </button>
          <button className="btn-outline px-3 py-1.5 text-xs" onClick={handleExportImage}>
            🖼 Görseli İndir
          </button>
          <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setShowSave(true)} disabled={saving}>
            💾 Konsepti Kaydet
          </button>
          <button className="btn-primary px-3 py-1.5 text-xs" onClick={createQuote} disabled={saving || items.length === 0}>
            🧾 Teklif Oluştur
          </button>
        </div>
      </footer>

      {/* -------------------------------- modallar ----------------------------- */}
      {showSave && (
        <Modal title="Konsepti Kaydet" onClose={() => setShowSave(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Konsept Adı">
              <input className="input" value={meta.name} onChange={(e) => setMeta({ name: e.target.value })} />
            </Field>
            <Field label="Müşteri Adı">
              <input className="input" value={meta.customerName} onChange={(e) => setMeta({ customerName: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <input className="input" value={meta.customerPhone} onChange={(e) => setMeta({ customerPhone: e.target.value })} />
            </Field>
            <Field label="Etkinlik Türü">
              <select className="input" value={meta.eventType} onChange={(e) => setMeta({ eventType: e.target.value })}>
                {EVENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Etkinlik Tarihi">
              <input type="date" className="input" value={meta.eventDate} onChange={(e) => setMeta({ eventDate: e.target.value })} />
            </Field>
            <Field label="Notlar">
              <input className="input" value={meta.notes} onChange={(e) => setMeta({ notes: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              className="btn-outline"
              onClick={async () => {
                await saveDesign({ isTemplate: true });
                setShowSave(false);
              }}
            >
              ✨ Hazır Konsept Olarak Kaydet
            </button>
            <button
              className="btn-primary"
              disabled={saving}
              onClick={async () => {
                await saveDesign();
                setShowSave(false);
              }}
            >
              💾 Kaydet {storeDesignId ? "(güncelle)" : ""}
            </button>
          </div>
        </Modal>
      )}

      {showList && (
        <Modal title="Malzeme Listesi" onClose={() => setShowList(false)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Ürün</th>
                  <th className="py-2 text-center">Adet</th>
                  <th className="py-2 text-right">Birim Fiyat</th>
                  <th className="py-2 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-700">{l.name}</td>
                    <td className="py-2 text-center">{l.qty}</td>
                    <td className="py-2 text-right">{l.unitPrice.toLocaleString("tr-TR")} ₺</td>
                    <td className="py-2 text-right font-semibold">{l.total.toLocaleString("tr-TR")} ₺</td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Sahnede ürün yok.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 text-right font-semibold">
                    Genel Toplam
                  </td>
                  <td className="py-3 text-right text-base font-bold text-indigo-700">
                    {total.toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {mobilePanel !== "none" && (
        <button
          aria-label="Paneli kapat"
          className="fixed inset-0 z-10 bg-slate-900/20 md:hidden"
          onClick={() => setMobilePanel("none")}
        />
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 rounded-lg border border-slate-200 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MiniBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="h-8 w-8 rounded-lg text-sm text-slate-600 transition hover:bg-slate-100"
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button className="btn-ghost h-8 w-8 p-0" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
