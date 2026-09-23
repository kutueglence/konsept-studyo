/* -------------------------------------------------------------------------- *
 *  Arka fon panelleri — otomatik yerleşim matematiği ve kategori eşleşmesi.
 *  Saftır; stüdyo mağazası (zustand) ve testler buradan beslenir.
 * -------------------------------------------------------------------------- */

/** "Konsept / Arka Fon Panelleri" kategorisindeki ürünler arka fon panelidir. */
export function isBackdropCategoryName(name: unknown): boolean {
  return typeof name === "string" && /arka\s*fon/i.test(name);
}

export interface BackdropPlacement {
  /** panel merkezinin duvardaki yatay konumu (cm) */
  x: number;
  /** panel merkezinin zeminden yüksekliği (cm) — zemine oturur */
  y: number;
  /** duvara sığması için uygulanacak ölçek (≤ 1; küçük panel büyütülmez) */
  scale: number;
  /** duvara yaslanma derinliği (cm) */
  z: number;
}

/**
 * Arka fon panelini sahneye yerleştirir:
 *  - duvara sığacak şekilde küçülür (duvardan büyükse), küçük panel büyütülmez,
 *  - bırakılan noktaya uyar ama duvardan taşacaksa kenarda tutulur,
 *  - bırakış noktası yoksa yatayda ortalanır,
 *  - zemine oturur ve duvara yaslanır.
 */
export function computeBackdropPlacement(
  wallWidth: number,
  wallHeight: number,
  panelWidth: number,
  panelHeight: number,
  dropX?: number,
): BackdropPlacement {
  const wallW = finite(wallWidth, 400);
  const wallH = finite(wallHeight, 250);
  const pw = Math.max(finite(panelWidth, 100), 1);
  const ph = Math.max(finite(panelHeight, 100), 1);

  const scale = Math.min(1, wallW / pw, wallH / ph);
  const w = pw * scale;
  const h = ph * scale;
  const half = w / 2;

  let x = finite(dropX, wallW / 2);
  // Duvar genişliği kadar açıklıkta tut (panel taşarsa kenara yaslanır).
  const lo = Math.min(half, wallW / 2);
  const hi = Math.max(wallW - half, wallW / 2);
  x = Math.min(Math.max(x, lo), hi);

  return { x: round1(x), y: round1(h / 2), scale: round3(scale), z: 0 };
}

function finite(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
