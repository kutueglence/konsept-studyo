/* -------------------------------------------------------------------------- *
 *  Konsept / Arka Fon Panelleri — biçim yolları ve kırpma/odak matematiği.
 *  Tamamen saftır: hem tarayıcıda (canvas + Path2D) hem Node testlerinde
 *  çalışır. Görsel asla gerilmez; panelin en/boy oranında üretilir.
 * -------------------------------------------------------------------------- */

export type PanelShape =
  | "panel-dikdortgen"
  | "panel-kemer"
  | "panel-yuvarlak"
  | "panel-oval"
  | "panel-kare"
  | "panel-dalga";

export const PANEL_SHAPE_OPTIONS: { value: PanelShape; label: string }[] = [
  { value: "panel-dikdortgen", label: "Dikdörtgen" },
  { value: "panel-kemer", label: "Kemer" },
  { value: "panel-yuvarlak", label: "Yuvarlak" },
  { value: "panel-oval", label: "Oval" },
  { value: "panel-kare", label: "Kare" },
  { value: "panel-dalga", label: "Dalgalı" },
];

export function isPanelShape(shape: unknown): shape is PanelShape {
  return typeof shape === "string" && PANEL_SHAPE_OPTIONS.some((o) => o.value === shape);
}

/** Yükseklik genişliğe kilitlenen biçimler (yuvarlak ve kare). */
export function isHeightLockedPanelShape(shape: PanelShape): boolean {
  return shape === "panel-yuvarlak" || shape === "panel-kare";
}

/**
 * Panel biçiminin SVG yol verisi. `w`/`h` herhangi bir birimde olabilir
 * (cm, px); yol (0,0)–(w,h) kutusuna sığar. Canvas'ta `new Path2D(d)`
 * ile maske olarak kullanılır.
 */
export function panelShapePathD(shape: PanelShape, w: number, h: number): string {
  const W = Math.max(w, 0.01);
  const H = Math.max(h, 0.01);
  switch (shape) {
    case "panel-yuvarlak": {
      const r = Math.min(W, H) / 2;
      const cx = W / 2;
      const cy = H / 2;
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0 Z`;
    }
    case "panel-oval": {
      const rx = W / 2;
      const ry = H / 2;
      const cx = W / 2;
      const cy = H / 2;
      return `M 0 ${cy} a ${rx} ${ry} 0 1 1 ${W} 0 a ${rx} ${ry} 0 1 1 ${-W} 0 Z`;
    }
    case "panel-kemer": {
      const r = W / 2;
      const archTop = r; // kemer tepesinden başlayıp yanlardan iner
      const straight = Math.max(H - archTop, 0);
      return `M 0 ${H} L 0 ${archTop} A ${r} ${r} 0 0 1 ${W} ${archTop} L ${W} ${H} Z`;
    }
    case "panel-dalga": {
      return scallopedRectPath(W, H);
    }
    case "panel-kare":
    case "panel-dikdortgen":
    default: {
      const rr = Math.min(W, H) * 0.02;
      return roundedRectPath(W, H, rr);
    }
  }
}

function roundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return `M ${rr} 0 L ${w - rr} 0 Q ${w} 0 ${w} ${rr} L ${w} ${h - rr} Q ${w} ${h} ${w - rr} ${h} L ${rr} ${h} Q 0 ${h} 0 ${h - rr} L 0 ${rr} Q 0 0 ${rr} 0 Z`;
}

/** Kenarları yumru (kabuk) çizgili dalgalı panel. */
function scallopedRectPath(w: number, h: number): string {
  const bump = Math.max(Math.min(w, h) * 0.06, 1);
  const inset = bump;
  const iw = Math.max(w - inset * 2, 1);
  const ih = Math.max(h - inset * 2, 1);

  const edge = (x0: number, y0: number, x1: number, y1: number, outward: [number, number]) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / (bump * 2)));
    const step = len / n;
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    const nx = outward[0];
    const ny = outward[1];
    let d = "";
    for (let i = 0; i < n; i++) {
      const ax = x0 + ux * step * i;
      const ay = y0 + uy * step * i;
      const bx = x0 + ux * step * (i + 1);
      const by = y0 + uy * step * (i + 1);
      const mx = (ax + bx) / 2 + nx * step * 0.5;
      const my = (ay + by) / 2 + ny * step * 0.5;
      d += ` L ${r2(ax)} ${r2(ay)} A ${r2(step / 2)} ${r2(step / 2)} 0 0 1 ${r2(mx)} ${r2(my)} A ${r2(
        step / 2,
      )} ${r2(step / 2)} 0 0 1 ${r2(bx)} ${r2(by)}`;
    }
    return d;
  };

  const left = inset;
  const right = inset + iw;
  const top = inset;
  const bottom = inset + ih;
  return (
    `M ${r2(left)} ${r2(top)}` +
    edge(left, top, right, top, [0, -1]) + // üst → yukarı yumrular
    edge(right, top, right, bottom, [1, 0]) + // sağ → dışa
    edge(right, bottom, left, bottom, [0, 1]) + // alt → aşağı
    edge(left, bottom, left, top, [-1, 0]) + // sol → dışa
    " Z"
  );
}

/* --------------------------- kırpma / odak matematiği ---------------------- */

export type PanelFitMode = "contain" | "cover";

export interface DrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Kaynak görselin tuvale nasıl çizileceğini hesaplar.
 *
 * - "contain" (Tamamını göster): kırpma yok; görsel tuvale ortalanarak sığar,
 *   boşluklar fon rengiyle doldurulur.
 * - "cover" (Alanı doldur): görsel tuvali tamamen kaplar; odak kaydırıcıları
 *   (focusX/focusY: 0=sol/üst, 0.5=orta, 1=sağ/alt) hangi tarafın
 *   kalacağını belirler.
 */
export function computeDrawRect(
  srcW: number,
  srcH: number,
  canvasW: number,
  canvasH: number,
  mode: PanelFitMode,
  focusX = 0.5,
  focusY = 0.5,
): DrawRect {
  const sw = Math.max(srcW, 1);
  const sh = Math.max(srcH, 1);
  const cw = Math.max(canvasW, 1);
  const ch = Math.max(canvasH, 1);
  const fx = clamp01(finite(focusX, 0.5));
  const fy = clamp01(finite(focusY, 0.5));

  if (mode === "contain") {
    const scale = Math.min(cw / sw, ch / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    return {
      sx: 0,
      sy: 0,
      sw,
      sh,
      dx: (cw - dw) / 2,
      dy: (ch - dh) / 2,
      dw,
      dh,
    };
  }

  // cover
  const srcAspect = sw / sh;
  const canvasAspect = cw / ch;
  let cropW: number;
  let cropH: number;
  if (srcAspect > canvasAspect) {
    // kaynak daha geniş → yatayda kırp
    cropH = sh;
    cropW = sh * canvasAspect;
  } else {
    // kaynak daha dar/uzun → dikeyde kırp
    cropW = sw;
    cropH = sw / canvasAspect;
  }
  const sx = (sw - cropW) * fx;
  const sy = (sh - cropH) * fy;
  return { sx, sy, sw: cropW, sh: cropH, dx: 0, dy: 0, dw: cw, dh: ch };
}

export interface RenderTarget {
  w: number;
  h: number;
  /** kaynak görsel hedef çözünürlüğün altındaysa true (büyütme yapılmaz) */
  warning: boolean;
}

/**
 * Panel görselinin üretileceği piksel boyutu: panelin en/boy oranı korunur
 * (uzatma/yayma yok), `maxSide` aşılırsa küçültülür ve kaynak görselden büyük
 * bir tuval açılmaz — bulanık kaynak büyütülmez, uyarı döner.
 *
 * Kırpma modundan bağımsız olarak büyütme yapmayan sınır, kaynağın panel
 * oranına sığdırılmış kutusudur (cover'da kırpılan alan, contain'de boşluklu
 * yerleşim kutusu — ikisi de aynı kutudur).
 */
export function computeRenderTargetSize(
  srcW: number,
  srcH: number,
  panelW: number,
  panelH: number,
  maxSide = 1600,
): RenderTarget {
  const sw = Math.max(Math.round(finite(srcW, 1)), 1);
  const sh = Math.max(Math.round(finite(srcH, 1)), 1);
  const pw = Math.max(finite(panelW, 100), 1);
  const ph = Math.max(finite(panelH, 100), 1);
  const cap = Math.max(finite(maxSide, 1600), 64);
  const aspect = pw / ph;

  // İdeal hedef: panel oranında, uzun kenarı cap olan tuval.
  let iw = cap;
  let ih = Math.round(cap / aspect);
  if (ih > cap) {
    ih = cap;
    iw = Math.round(cap * aspect);
  }

  // Kaynağı büyütmeden çizilebilecek en büyük panel oranlı kutu.
  const sourceAspect = sw / sh;
  const limW = sourceAspect > aspect ? sh * aspect : sw;
  const limH = sourceAspect > aspect ? sh : sw / aspect;

  const k = Math.min(Math.max(limW, 1) / iw, Math.max(limH, 1) / ih, 1);
  let outW = Math.max(Math.round(iw * k), 16);
  let outH = Math.max(Math.round(ih * k), 16);
  if (outH > ih) {
    outH = ih;
    outW = Math.round(ih * aspect);
  }
  return { w: outW, h: outH, warning: k < 1 };
}

/* ------------------------------ yükleme doğrulama -------------------------- */

export const PANEL_IMAGE_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const PANEL_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Panel görseli yükleme kuralları: yalnız PNG/JPG/WebP, en çok 20 MB. */
export function validatePanelImageFile(file: {
  type?: string;
  size?: number;
  name?: string;
}): { ok: true } | { ok: false; error: string } {
  const type = String(file.type ?? "").toLowerCase();
  if (!PANEL_IMAGE_MIME_TYPES.includes(type as (typeof PANEL_IMAGE_MIME_TYPES)[number])) {
    return {
      ok: false,
      error:
        "Yalnızca PNG, JPG veya WebP yükleyebilirsiniz. SVG/GIF kabul edilmez; önce PNG/JPG'ye çevirin.",
    };
  }
  const size = Number(file.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "Görsel okunamadı." };
  }
  if (size > PANEL_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Görsel 20 MB sınırını aşıyor." };
  }
  return { ok: true };
}

/* --------------------------------- yardımcı -------------------------------- */

function finite(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
