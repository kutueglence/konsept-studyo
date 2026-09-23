/* -------------------------------------------------------------------------- *
 *  Duvar tipi & desen — sahne duvarına uygulanabilen, gerçek santimetreyle
 *  ölçeklenen yüzey desenleri. Bu modül tamamen safdır (React/DOM bağımlılığı
 *  yoktur) ve hem tarayıcıda hem testlerde çalışır.
 *
 *  Desenler, odanın "wallPattern" ayarında saklanır; Stage bileşeni
 *  buildWallPatternLayer() çıktısını ayrı bir katman olarak duvarın üstüne
 *  bindirir. Mavi hizalama ızgarasından bağımsızdır, birbirini bozmaz.
 * -------------------------------------------------------------------------- */

export type WallPatternType =
  | "duz"
  | "kare"
  | "tugla"
  | "dikey"
  | "yatay"
  | "cita"
  | "zikzak"
  | "puantiye";

export interface WallPatternConfig {
  type: WallPatternType;
  /** desen aralığı — cm (tuğla için tuğla uzunluğu, şerit için periyot…) */
  spacing: number;
  /** çizgi / nokta kalınlığı — cm */
  thickness: number;
  /** desen / derz rengi */
  color: string;
  /** belirginlik — 0..1 */
  strength: number;
}

export interface WallPatternOption {
  value: WallPatternType;
  label: string;
  icon: string;
  /** bu desene geçildiğinde önerilen aralık ve kalınlık (cm) */
  spacing: number;
  thickness: number;
}

/** Sekiz hazır yüzey: düz duvar + yedi desen. */
export const WALL_PATTERN_OPTIONS: WallPatternOption[] = [
  { value: "duz", label: "Düz Duvar", icon: "▯", spacing: 30, thickness: 1.5 },
  { value: "kare", label: "Kare Paneller", icon: "▦", spacing: 40, thickness: 1.5 },
  { value: "tugla", label: "Tuğla Duvar", icon: "🧱", spacing: 30, thickness: 1.5 },
  { value: "dikey", label: "Dikey Şerit", icon: "▮▯", spacing: 14, thickness: 5 },
  { value: "yatay", label: "Yatay Şerit", icon: "▬", spacing: 14, thickness: 5 },
  { value: "cita", label: "Ahşap Çıta", icon: "🪵", spacing: 9, thickness: 6 },
  { value: "zikzak", label: "Zikzak", icon: "⧅", spacing: 30, thickness: 1.5 },
  { value: "puantiye", label: "Puantiye", icon: "⠿", spacing: 20, thickness: 5 },
];

export const DEFAULT_WALL_PATTERN: WallPatternConfig = {
  type: "duz",
  spacing: 30,
  thickness: 1.5,
  color: "#b3a394",
  strength: 0.55,
};

/** Desen ayarlarını güvenli aralıklara çeker. */
export function normalizeWallPattern(input: unknown): WallPatternConfig {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<WallPatternConfig>;
  const type = WALL_PATTERN_OPTIONS.some((o) => o.value === raw.type)
    ? (raw.type as WallPatternType)
    : "duz";
  const spacing = clamp(finite(raw.spacing, DEFAULT_WALL_PATTERN.spacing), 2, 300);
  const thickness = clamp(finite(raw.thickness, DEFAULT_WALL_PATTERN.thickness), 0.2, 60);
  const color = isHexColor(raw.color) ? (raw.color as string) : DEFAULT_WALL_PATTERN.color;
  const strength = clamp(finite(raw.strength, DEFAULT_WALL_PATTERN.strength), 0, 1);
  return {
    type,
    spacing: Math.min(spacing, 300),
    thickness: Math.min(thickness, spacing),
    color,
    strength,
  };
}

export interface WallPatternLayer {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  /** desen katmanının saydamlığı (belirginlik) */
  opacity: number;
}

/**
 * Deseni CSS arka plan katmanına çevirir. `pxPerCm` sahnenin o anki ölçeği
 * olduğundan desen her zaman gerçek santimetreyle çizilir: 400 cm duvarda
 * 30 cm'lik tuğla her zaman duvarın 30/400 = 1/13 genişliğidir. Yakınlaştırma
 * yalnızca sahneyi büyütür; desen ek olarak gerilmez.
 *
 * Düz duvar veya geçersiz desen için null döner.
 */
export function buildWallPatternLayer(input: unknown, pxPerCm: number): WallPatternLayer | null {
  const cfg = normalizeWallPattern(input);
  if (cfg.type === "duz") return null;
  const scale = finite(pxPerCm, 1);
  if (!Number.isFinite(scale) || scale <= 0) return null;

  const tile = patternTile(cfg);
  // Çok uzaklaştırıldığında karo pikselden küçük kalırsa desen gizlenir (moire önlenir).
  if (tile.wCm * scale < 3 || tile.hCm * scale < 3) return null;

  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgFor(tile))}")`,
    backgroundSize: `${round3(tile.wCm * scale)}px ${round3(tile.hCm * scale)}px`,
    backgroundPosition: "0 0",
    backgroundRepeat: "repeat",
    opacity: round3(cfg.strength),
  };
}

/* ------------------------------- desen karoları ---------------------------- */

interface PatternTile {
  wCm: number;
  hCm: number;
  body: string;
}

function patternTile(cfg: WallPatternConfig): PatternTile {
  const s = Math.max(cfg.spacing, 0.1);
  const t = Math.min(Math.max(cfg.thickness, 0.1), s);
  const c = cfg.color;

  switch (cfg.type) {
    case "kare": {
      // Kare panel karesi: karonun içine yerleşen çerçeve. Komşu karolarla
      // birleşerek sürekli bir panel ızgarası oluşturur.
      const inset = t / 2;
      return {
        wCm: s,
        hCm: s,
        body: `<rect x="${r(inset)}" y="${r(inset)}" width="${r(Math.max(s - t, 0.1))}" height="${r(
          Math.max(s - t, 0.1),
        )}" fill="none" stroke="${c}" stroke-width="${r(t)}"/>`,
      };
    }
    case "tugla": {
      // Şaşırtalı derzli tuğla: karo = tuğla uzunluğu × iki sıra yüksekliği.
      // Üst sıra derzi x=0 ve x=s'te, alt sıra x=s/2'de → sıralar yarım
      // tuğla kayar. Karo sınırlarından taşan çizgileri komşu karo tamamlar.
      const rowH = s / 2;
      const inset = t / 2;
      const bw = Math.max(s - t, 0.1);
      const bh = Math.max(rowH - t, 0.1);
      return {
        wCm: s,
        hCm: rowH * 2,
        body:
          `<rect x="${r(inset)}" y="${r(inset)}" width="${r(bw)}" height="${r(bh)}" fill="none" stroke="${c}" stroke-width="${r(t)}"/>` +
          `<rect x="${r(-s / 2 + inset)}" y="${r(rowH + inset)}" width="${r(bw)}" height="${r(
            bh,
          )}" fill="none" stroke="${c}" stroke-width="${r(t)}"/>`,
      };
    }
    case "dikey": {
      return {
        wCm: s,
        hCm: s,
        body: `<rect x="0" y="0" width="${r(t)}" height="${r(s)}" fill="${c}"/>`,
      };
    }
    case "yatay": {
      return {
        wCm: s,
        hCm: s,
        body: `<rect x="0" y="0" width="${r(s)}" height="${r(t)}" fill="${c}"/>`,
      };
    }
    case "cita": {
      // Ahşap çıta: renkli lath + kenarında açık/koyu vurgu çizgileri.
      const hi = Math.max(t * 0.1, 0.05);
      return {
        wCm: s,
        hCm: s,
        body:
          `<rect x="0" y="0" width="${r(t)}" height="${r(s)}" fill="${c}"/>` +
          `<rect x="${r(t * 0.12)}" y="0" width="${r(hi)}" height="${r(s)}" fill="#ffffff" opacity="0.3"/>` +
          `<rect x="${r(t * 0.8)}" y="0" width="${r(hi)}" height="${r(s)}" fill="#000000" opacity="0.22"/>`,
      };
    }
    case "zikzak": {
      const h = s * 0.6;
      const pad = t + 1;
      return {
        wCm: s,
        hCm: h,
        body: `<path d="M ${r(-pad)} ${r(h * 0.74)} L ${r(s / 2)} ${r(h * 0.26)} L ${r(
          s + pad,
        )} ${r(h * 0.74)}" fill="none" stroke="${c}" stroke-width="${r(t)}" stroke-linecap="butt" stroke-linejoin="miter"/>`,
      };
    }
    case "puantiye": {
      // Düzenli (kanelür) nokta dizilimi: merkez + köşeler. Köşedekiler komşu
      // karolarla birleşir, satırlar yarım aralık kayar.
      const rad = t / 2;
      const dots = [
        [s / 2, s / 2],
        [0, 0],
        [s, 0],
        [0, s],
        [s, s],
      ]
        .map(([x, y]) => `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="${c}"/>`)
        .join("");
      return { wCm: s, hCm: s, body: dots };
    }
    default:
      return { wCm: s, hCm: s, body: "" };
  }
}

function svgFor(tile: PatternTile): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(tile.wCm)} ${r(tile.hCm)}" ` +
    `width="${r(tile.wCm)}" height="${r(tile.hCm)}">${tile.body}</svg>`
  );
}

/* --------------------------------- yardımcı -------------------------------- */

function finite(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v);
}

function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
