/* -------------------------------------------------------------------------- *
 *  Ürün / konsept API'leri için sunucu tarafı doğrulama ve temizleme.
 *  Tamamen saftır (DB veya Next bağımlılığı yok) — birim testleri doğrudan
 *  bu modülü kullanır.
 * -------------------------------------------------------------------------- */

/** Yönetici görsel yükleri: çözülmüş en fazla 20 MB. */
export const MAX_PRODUCT_IMAGE_BYTES = 20 * 1024 * 1024;
/** Data URL olarak kabul edilen görsel tipleri (SVG/GIF reddedilir). */
const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
/** Bu kadar karakterden uzun data URL'ler liste yanıtına gömülmez. */
export const INLINE_IMAGE_URL_LIMIT = 64 * 1024;

/* ------------------------------ görsel yardımcıları ------------------------ */

export interface ParsedDataUrl {
  mime: string;
  bytes: Uint8Array;
  byteLength: number;
}

/** `data:image/webp;base64,...` biçimini ayrıştırır; geçersizse null. */
export function parseImageDataUrl(url: unknown): ParsedDataUrl | null {
  if (typeof url !== "string") return null;
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(url.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME.has(mime)) return null;
  try {
    const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
    if (!bytes.length) return null;
    return { mime, bytes, byteLength: bytes.length };
  } catch {
    return null;
  }
}

/** Data URL'nin çözülmüş bayt uzunluğu (kabul edilebilir görselse). */
export function imageDataUrlBytes(url: unknown): number {
  const parsed = parseImageDataUrl(url);
  return parsed ? parsed.byteLength : -1;
}

/** Data URL'nin çözülmüş bayt uzunluğu — MIME denetimsiz (boyut testi için). */
export function dataUrlByteLength(url: unknown): number {
  if (typeof url !== "string") return -1;
  const match = /^data:[^,]*;base64,([A-Za-z0-9+/=]*)$/i.exec(url.trim());
  if (!match) return -1;
  const padding = match[1].endsWith("==") ? 2 : match[1].endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((match[1].length * 3) / 4) - padding);
}

/* ------------------------------- ürün girdisi ------------------------------ */

export interface SanitizedProduct {
  name: string;
  categoryId: number | null;
  subcategoryId: number | null;
  imageUrl: string | null;
  modelUrl: string | null;
  shape: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  colorEditable: boolean;
  material: string | null;
  price: number;
  stock: number;
  description: string | null;
  plane: string;
  tags: string | null;
  isActive: boolean;
}

export type SanitizeResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SHAPE_RE = /^[a-z0-9-]{1,40}$/;
const PLANE_VALUES = new Set(["wall", "floor", "ceiling"]);

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sanitizeImageUrl(v: unknown): { url: string | null; error?: string } {
  if (v === null || v === undefined || v === "") return { url: null };
  if (typeof v !== "string") return { url: null, error: "Geçersiz görsel." };
  const url = v.trim();
  if (!url) return { url: null };
  if (url.startsWith("data:")) {
    const parsed = parseImageDataUrl(url);
    if (!parsed) {
      return {
        url: null,
        error: "Görsel yalnızca PNG, JPG, WebP veya GIF data URL olabilir.",
      };
    }
    if (parsed.byteLength > MAX_PRODUCT_IMAGE_BYTES) {
      return { url: null, error: "Görsel 20 MB sınırını aşıyor." };
    }
    return { url };
  }
  if (/^https?:\/\//i.test(url) && url.length <= 2048) return { url };
  return { url: null, error: "Görsel bağlantısı geçersiz." };
}

/** POST /api/products gövdesini doğrular ve temizler. */
export function sanitizeProductInput(body: Record<string, unknown>): SanitizeResult<SanitizedProduct> {
  const name = str(body.name, 200);
  if (!name) return { ok: false, error: "Ürün adı zorunludur." };

  const image = sanitizeImageUrl(body.imageUrl);
  if (image.error) return { ok: false, error: image.error };
  const modelUrl = body.modelUrl ? str(body.modelUrl, 2048) : "";
  if (modelUrl && !/^https?:\/\//i.test(modelUrl)) {
    return { ok: false, error: "3D model bağlantısı geçersiz." };
  }

  const shape = str(body.shape, 40).toLowerCase() || "kutu";
  if (!SHAPE_RE.test(shape)) return { ok: false, error: "Geçersiz şekil." };

  for (const key of ["width", "height", "depth"] as const) {
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < (key === "depth" ? 0 : 1) || n > 2000) {
      return { ok: false, error: "Ölçüler sayı olmalı; genişlik/yükseklik en az 1 cm olmalı." };
    }
  }
  const width = num(body.width, 50, 1, 2000);
  const height = num(body.height, 50, 1, 2000);
  const depth = num(body.depth, 10, 0, 2000);

  const plane = str(body.plane, 16) || "wall";
  if (!PLANE_VALUES.has(plane)) return { ok: false, error: "Geçersiz düzlem." };

  const color = /^#[0-9a-fA-F]{3,8}$/.test(str(body.color, 32))
    ? str(body.color, 32)
    : "#f0abfc";

  return {
    ok: true,
    data: {
      name,
      categoryId: toId(body.categoryId),
      subcategoryId: toId(body.subcategoryId),
      imageUrl: image.url,
      modelUrl: modelUrl || null,
      shape,
      width,
      height,
      depth,
      color,
      colorEditable: body.colorEditable !== false,
      material: str(body.material, 120) || null,
      price: num(body.price, 0, 0, 10_000_000),
      stock: Math.round(num(body.stock, 0, 0, 1_000_000)),
      description: str(body.description, 2000) || null,
      plane,
      tags: str(body.tags, 300) || null,
      isActive: body.isActive !== false,
    },
  };
}

/**
 * PATCH /api/products/[id] — yalnızca gönderilen anahtarları doğrular.
 * Yönetici arayüzü tüm formu gönderir; kısmi istemler de güvenli kalır.
 */
export function sanitizeProductPatch(body: Record<string, unknown>): SanitizeResult<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};
  for (const key of ["name", "shape", "color", "material", "description", "plane", "tags"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  const partial = sanitizeProductInput({ ...emptyProductBody, ...patch });
  if (!partial.ok) return partial;
  const out: Record<string, unknown> = {};
  const map: Record<string, unknown> = partial.data as unknown as Record<string, unknown>;
  for (const key of Object.keys(patch)) out[key] = map[key];
  if (body.imageUrl !== undefined) {
    const image = sanitizeImageUrl(body.imageUrl);
    if (image.error) return { ok: false, error: image.error };
    out.imageUrl = image.url;
  }
  if (body.modelUrl !== undefined) {
    const modelUrl = str(body.modelUrl, 2048);
    if (modelUrl && !/^https?:\/\//i.test(modelUrl)) {
      return { ok: false, error: "3D model bağlantısı geçersiz." };
    }
    out.modelUrl = modelUrl || null;
  }
  for (const key of ["width", "height", "depth"] as const) {
    if (body[key] !== undefined) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < (key === "depth" ? 0 : 1) || n > 2000) {
        return { ok: false, error: "Ölçüler sayı olmalı; genişlik/yükseklik en az 1 cm olmalı." };
      }
      out[key] = n;
    }
  }
  if (body.price !== undefined) out.price = num(body.price, 0, 0, 10_000_000);
  if (body.stock !== undefined) out.stock = Math.round(num(body.stock, 0, 0, 1_000_000));
  if (body.categoryId !== undefined) out.categoryId = toId(body.categoryId);
  if (body.subcategoryId !== undefined) out.subcategoryId = toId(body.subcategoryId);
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);
  if (body.colorEditable !== undefined) out.colorEditable = Boolean(body.colorEditable);
  return { ok: true, data: out };
}

const emptyProductBody: Record<string, unknown> = {
  name: "x",
  width: 50,
  height: 50,
  depth: 10,
  color: "#f0abfc",
  plane: "wall",
  shape: "kutu",
};

function toId(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/* --------------------------- liste yanıtını hafiflet ----------------------- */

/**
 * Data URL → kısa imza. Görsel değişirse imza değişir; tarayıcı önbelleği
 * sürüm imzasıyla tazelenir. Uzunluk ve son karakterler her zaman imzaya
 * girer, gövde seyrek örneklenir.
 */
export function imageSig(url: string): string {
  let h1 = 0x811c9dc5;
  let h2 = url.length;
  const step = Math.max(1, Math.ceil(url.length / 2048));
  for (let i = 0; i < url.length; i += step) {
    h1 = (Math.imul(h1 ^ url.charCodeAt(i), 0x01000193) >>> 0) >>> 0;
    h2 = (Math.imul(h2 + url.charCodeAt(i), 31) + i) >>> 0;
  }
  for (let i = Math.max(0, url.length - 8); i < url.length; i++) {
    h1 = (Math.imul(h1 ^ url.charCodeAt(i), 0x01000193) >>> 0) >>> 0;
  }
  const a = h1.toString(36);
  const b = h2.toString(36);
  return `${b}${a}`.slice(0, 12);
}

export interface ProductLikeRow {
  id: number;
  imageUrl: string | null;
}

/**
 * Büyük görselleri liste yanıtına gömmez; onun yerine sürüm imzalı
 * `/api/products/{id}/image` bağlantısı döner. Küçük görseller ve dış
 * bağlantılar olduğu gibi kalır. (Yönetim `?all=1` ile ham verı alır.)
 */
export function lightweightProductImage<T extends ProductLikeRow>(row: T): string | null {
  const url = row.imageUrl;
  if (!url) return null;
  if (!url.startsWith("data:")) return url;
  if (dataUrlByteLength(url) <= INLINE_IMAGE_URL_LIMIT) return url;
  return `/api/products/${row.id}/image?v=${imageSig(url)}`;
}

/** Sahne nesnesi görselleri: data URL, iç /api bağlantısı veya dış bağlantı. */
export const MAX_SCENE_IMAGE_BYTES = 30 * 1024 * 1024;

function sanitizeSceneImageUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const url = v.trim();
  if (!url) return null;
  if (url.startsWith("/") && url.length <= 2048) return url;
  if (/^https?:\/\//i.test(url) && url.length <= 2048) return url;
  if (url.startsWith("data:")) {
    const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(url);
    if (
      match &&
      ALLOWED_IMAGE_MIME.has(match[1].toLowerCase()) &&
      dataUrlByteLength(url) <= MAX_SCENE_IMAGE_BYTES
    ) {
      return url;
    }
  }
  return null;
}

/* --------------------------- konsept (tasarım) girdisi --------------------- */

const WALL_PATTERN_KEYS = new Set(["duz", "kare", "tugla", "dikey", "yatay", "cita", "zikzak", "puantiye"]);

export interface SanitizedDesign {
  name: string;
  customerName: string | null;
  customerPhone: string | null;
  eventType: string | null;
  eventDate: string | null;
  room: Record<string, unknown>;
  items: Record<string, unknown>[];
  total: number;
  notes: string | null;
  isTemplate: boolean;
  coverColor: string;
}

function clampRoomValue(key: string, value: unknown): unknown {
  switch (key) {
    case "wallWidth":
    case "wallHeight":
    case "floorDepth":
      return num(value, key === "floorDepth" ? 300 : 250, 20, 5000);
    case "snapSize":
      return num(value, 5, 1, 100);
    case "ambientLight":
      return num(value, 1, 0.3, 2);
    case "gridVisible":
    case "snapEnabled":
    case "showCeiling":
      return value === true;
    case "wallPattern": {
      const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
      const type = WALL_PATTERN_KEYS.has(String(raw.type)) ? String(raw.type) : "duz";
      const spacing = num(raw.spacing, 30, 2, 300);
      return {
        type,
        spacing,
        thickness: Math.min(num(raw.thickness, 1.5, 0.2, 60), spacing),
        color: /^#[0-9a-fA-F]{3,8}$/.test(String(raw.color)) ? String(raw.color) : "#b3a394",
        strength: num(raw.strength, 0.55, 0, 1),
      };
    }
    default:
      return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : undefined;
  }
}

/** POST/PATCH /api/designs gövdesini doğrular ve temizler. */
export function sanitizeDesignPayload(body: Record<string, unknown>): SanitizeResult<SanitizedDesign> {
  const name = str(body.name, 200);
  if (!name) return { ok: false, error: "Konsept adı zorunludur." };

  const rawRoom = (body.room && typeof body.room === "object" ? body.room : {}) as Record<string, unknown>;
  const room: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawRoom)) {
    const cleaned = clampRoomValue(key, value);
    if (cleaned !== undefined) room[key] = cleaned;
  }

  const items = sanitizeSceneItems(body.items);
  return {
    ok: true,
    data: {
      name,
      customerName: str(body.customerName, 200) || null,
      customerPhone: str(body.customerPhone, 60) || null,
      eventType: str(body.eventType, 120) || null,
      eventDate: str(body.eventDate, 40) || null,
      room,
      items,
      total: num(body.total, 0, 0, 1_000_000_000),
      notes: str(body.notes, 4000) || null,
      isTemplate: body.isTemplate === true,
      coverColor: /^#[0-9a-fA-F]{3,8}$/.test(str(body.coverColor, 32))
        ? str(body.coverColor, 32)
        : "#fde68a",
    },
  };
}

/** Sahnedeki nesneleri temizler: bilinmeyen türler atılır, sayılar sınırlandırılır. */
export function sanitizeSceneItems(input: unknown): Record<string, unknown>[] {
  if (!Array.isArray(input)) return [];
  const out: Record<string, unknown>[] = [];
  for (const raw of input.slice(0, 500)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const kind = item.kind === "text" ? "text" : item.kind === "product" ? "product" : null;
    if (!kind) continue;
    const cleaned: Record<string, unknown> = {
      id: str(item.id, 40) || `it_${out.length + 1}`,
      kind,
      name: str(item.name, 200) || (kind === "text" ? "Yazı" : "Ürün"),
      plane: PLANE_VALUES.has(String(item.plane)) ? String(item.plane) : "wall",
      x: num(item.x, 0, -20000, 20000),
      y: num(item.y, 0, -20000, 20000),
      z: num(item.z, 0, -20000, 20000),
      width: num(item.width, 50, 0.5, 5000),
      height: num(item.height, 50, 0.5, 5000),
      rotation: num(item.rotation, 0, -3600, 3600),
      scale: num(item.scale, 1, 0.05, 10),
      color: str(item.color, 40) || "#cccccc",
      opacity: num(item.opacity, 1, 0.05, 1),
      layer: num(item.layer, 1, -100000, 100000),
      qty: Math.round(num(item.qty, 1, 1, 10000)),
      locked: item.locked === true,
      visible: item.visible !== false,
    };
    if (kind === "product") {
      cleaned.productId = Math.round(num(item.productId, 0, 0, 100_000_000));
      cleaned.shape = SHAPE_RE.test(str(item.shape, 40)) ? str(item.shape, 40) : "kutu";
      cleaned.imageUrl = sanitizeSceneImageUrl(item.imageUrl);
      cleaned.price = num(item.price, 0, 0, 10_000_000);
      cleaned.category = str(item.category, 300) || null;
    } else {
      cleaned.text = str(item.text, 200);
      cleaned.fontFamily = str(item.fontFamily, 120) || "'Segoe UI', system-ui, sans-serif";
      cleaned.fontSize = num(item.fontSize, 30, 2, 300);
      cleaned.fontWeight = Math.round(num(item.fontWeight, 700, 100, 900));
      cleaned.letterSpacing = num(item.letterSpacing, 2, -20, 60);
      cleaned.price = num(item.price, 0, 0, 10_000_000);
      cleaned.glow = item.glow === true;
    }
    out.push(cleaned);
  }
  return out;
}

/* --------------------- kaydedilen konseptin görsel kopyası ----------------- */

const PRODUCT_IMAGE_URL_RE = /^\/api\/products\/(\d+)\/image(?:\?|$)/;

/**
 * Sahnedeki `/api/products/{id}/image` bağlantılarını, o anki ürün görselinin
 * anlık kopyasıyla (data URL) değiştirir. Böylece ürün daha sonra değişse ya
 * da silinse bile eski konsept bozulmaz.
 */
export async function snapshotDesignImages<T extends { kind?: string; imageUrl?: unknown }>(
  items: T[],
  resolve: (productId: number) => Promise<string | null>,
): Promise<T[]> {
  const cache = new Map<number, string | null>();
  const out: T[] = [];
  for (const item of items) {
    const url = typeof item.imageUrl === "string" ? item.imageUrl : "";
    const match = PRODUCT_IMAGE_URL_RE.exec(url);
    if (!match) {
      out.push(item);
      continue;
    }
    const productId = Number(match[1]);
    if (!cache.has(productId)) {
      cache.set(productId, await resolve(productId));
    }
    const resolved = cache.get(productId) ?? null;
    out.push({ ...item, imageUrl: resolved });
  }
  return out;
}
