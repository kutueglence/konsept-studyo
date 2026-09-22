"use client";

import { useRef, useState, type ChangeEvent } from "react";

interface Props {
  addCustomImage: (imageUrl: string, filename: string, width?: number, height?: number) => string;
}

const PRESET_SIZES = [
  { label: "Küçük (40×40)", w: 40, h: 40 },
  { label: "Orta (80×80)", w: 80, h: 80 },
  { label: "Büyük (120×120)", w: 120, h: 120 },
  { label: "Panel (180×180)", w: 180, h: 180 },
  { label: "Dik (80×120)", w: 80, h: 120 },
  { label: "Yatay (160×90)", w: 160, h: 90 },
  { label: "Poster (100×150)", w: 100, h: 150 },
  { label: "Banner (200×60)", w: 200, h: 60 },
  { label: "Fotoğraf Çerçevesi (50×60)", w: 50, h: 60 },
  { label: "Özel ölçül…", w: 0, h: 0 },
];

export default function ImageUploadTab({ addCustomImage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [sizeIdx, setSizeIdx] = useState(1);
  const [customW, setCustomW] = useState("100");
  const [customH, setCustomH] = useState("100");
  const [history, setHistory] = useState<{ src: string; name: string }[]>([]);

  const isCustom = sizeIdx === PRESET_SIZES.length - 1;
  const selected = PRESET_SIZES[sizeIdx];

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Lütfen PNG, JPG veya SVG dosyası seçin.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      setPreview(src);
      setFilename(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAdd = () => {
    if (!preview) return;
    const w = isCustom ? Math.max(10, Number(customW) || 80) : selected.w;
    const h = isCustom ? Math.max(10, Number(customH) || 80) : selected.h;
    addCustomImage(preview, filename || "Görsel", w, h);
    setHistory((prev) => [{ src: preview, name: filename || "Görsel" }, ...prev].slice(0, 20));
    setPreview(null);
    setFilename("");
  };

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
        <p className="mb-2 text-3xl">🖼️</p>
        <p className="text-sm font-semibold text-slate-700">Bilgisayarınızdan görsel seçin</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Panellere, duvarlara veya sahneye yapıştırmak istediğiniz PNG, JPG veya SVG dosyasını yükleyin.
        </p>
        <button
          className="btn-primary mt-3 px-4 py-2 text-sm"
          onClick={() => fileRef.current?.click()}
        >
          📁 Dosya Seç
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {preview && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Seçilen Görsel
          </p>
          <div className="mb-3 flex justify-center">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,transparent_0%_50%)] bg-[length:12px_12px] p-1">
              <img
                src={preview}
                alt="Önizleme"
                className="max-h-36 max-w-full object-contain"
              />
            </div>
          </div>

          <label className="block">
            <span className="label">Görsel Adı (isteğe bağlı)</span>
            <input
              className="input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="örn: çiçek panel görseli"
            />
          </label>

          <div className="mt-3">
            <span className="label">Boyut</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIZES.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSizeIdx(i)}
                  className={`chip text-[10px] ${i === sizeIdx ? "chip-active" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {isCustom && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="label">Genişlik (cm)</span>
                <input
                  className="input"
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Yükseklik (cm)</span>
                <input
                  className="input"
                  type="number"
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                />
              </label>
            </div>
          )}

          <button className="btn-primary mt-3 w-full py-2.5 text-sm" onClick={handleAdd}>
            🎯 Sahneye Yerleştir
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Yerleştirme sonrası sağ panelden Boyut, Renk, Opaklık, Döndürme ayarlarını yapabilirsiniz.
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Son Yüklenenler
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {history.map((h, i) => (
              <button
                key={`${h.name}-${i}`}
                onClick={() => {
                  setPreview(h.src);
                  setFilename(h.name);
                }}
                title={h.name}
                className="group flex h-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-indigo-300"
              >
                <img
                  src={h.src}
                  alt={h.name}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        <p className="mb-1 font-semibold text-slate-600">💡 İpuçları</p>
        <ul className="list-disc space-y-1 pl-3.5">
          <li>
            Şeffaf arka planlı PNG veya SVG dosyaları en iyi sonucu verir.
          </li>
          <li>
            Paneller için kendi görsellerinizi yükleyin; duvara yapıştırılmış poster, çerçeve veya dekoratif sticker gibi görünür.
          </li>
          <li>
            Görseli yerleştirdikten sonra sağ panelden <strong>Opaklık</strong> ile yarı-saydam efekt verebilirsiniz.
          </li>
          <li>
            Görseli sahneye sürükleyip bırakmak da çalışır.
          </li>
          <li>
            Görseller tarayıcıda Base64 olarak saklanır; küçük dosyalar kullanmanız önerilir.
          </li>
        </ul>
      </div>
    </div>
  );
}
