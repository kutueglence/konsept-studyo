"use client";

/* -------------------------------------------------------------------------- *
 *  Panel görselini tuvalde üretir: panel biçimine göre maskelenmiş, en/boy
 *  oranında (uzatılmamış), gerektiğinde kırpılmış/odaklanmış WebP çıktısı.
 *  Matematik src/lib/editor/panel-image.ts içinde (saf, testli); burada
 *  yalnızca canvas/WebP hattı var.
 * -------------------------------------------------------------------------- */

import {
  computeDrawRect,
  computeRenderTargetSize,
  panelShapePathD,
  type PanelFitMode,
  type PanelShape,
} from "./panel-image";

export interface PanelRenderOptions {
  shape: PanelShape;
  panelW: number;
  panelH: number;
  mode: PanelFitMode;
  /** 0 = sol/üst, 0.5 = orta, 1 = sağ/alt */
  focusX: number;
  focusY: number;
  /** "Tamamını göster" modunda boşlukların fon rengi */
  fillColor: string;
  maxSide?: number;
}

export interface PanelRenderResult {
  dataUrl: string;
  width: number;
  height: number;
  mime: string;
  /** kaynak görsel hedefin altındaysa true (büyütme yapılmadı) */
  warning: boolean;
}

type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function sourceSize(source: ImageSource): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth || 1, h: source.naturalHeight || 1 };
  }
  return { w: source.width || 1, h: source.height || 1 };
}

/** Görseli panel biçiminde yeniden üretir (uzatma yok, büyütme yok). */
export async function renderPanelImage(
  source: ImageSource,
  opts: PanelRenderOptions,
): Promise<PanelRenderResult> {
  const { w: srcW, h: srcH } = sourceSize(source);
  const target = computeRenderTargetSize(srcW, srcH, opts.panelW, opts.panelH, opts.maxSide ?? 1600);

  const canvas = document.createElement("canvas");
  canvas.width = target.w;
  canvas.height = target.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor.");

  if (opts.mode === "contain") {
    ctx.fillStyle = opts.fillColor || "#ffffff";
    ctx.fillRect(0, 0, target.w, target.h);
  }

  const rect = computeDrawRect(srcW, srcH, target.w, target.h, opts.mode, opts.focusX, opts.focusY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);

  // Panel biçimi dışını şeffaf yap.
  ctx.globalCompositeOperation = "destination-in";
  ctx.fill(new Path2D(panelShapePathD(opts.shape, target.w, target.h)));

  let blob = await canvasToBlob(canvas, "image/webp", 0.85);
  let mime = "image/webp";
  if (!blob) {
    blob = await canvasToBlob(canvas, "image/png");
    mime = "image/png";
  }
  if (!blob) throw new Error("Görsel üretilamedi.");
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, width: target.w, height: target.h, mime, warning: target.warning };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob && blob.type === type ? blob : blob && type === "image/png" ? blob : null),
        type,
        quality,
      );
    } catch {
      resolve(null);
    }
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(blob);
  });
}

/** Data URL'yi çizilebilir görsel kaynağına çevirir. */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel açılamadı."));
    img.src = url;
  });
}
