import assert from "node:assert/strict";
import test from "node:test";
import {
  INLINE_IMAGE_URL_LIMIT,
  dataUrlByteLength,
  imageSig,
  lightweightProductImage,
  parseImageDataUrl,
  sanitizeDesignPayload,
  sanitizeProductInput,
  sanitizeProductPatch,
  sanitizeSceneItems,
  snapshotDesignImages,
} from "../src/lib/server/product-sanitize.ts";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function baseProduct(overrides = {}) {
  return {
    name: "Test Panel",
    categoryId: 2,
    subcategoryId: null,
    shape: "panel-kemer",
    width: 120,
    height: 200,
    depth: 6,
    color: "#f5ede4",
    price: 850,
    stock: 4,
    plane: "wall",
    ...overrides,
  };
}

/* ------------------------------ data URL ayrıştırma ------------------------- */

test("geçerli data URL'ler ayrıştırılır", () => {
  for (const mime of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
    const parsed = parseImageDataUrl(`data:${mime};base64,${"QQ=="}`);
    assert.ok(parsed, mime);
    assert.equal(parsed.mime, mime);
    assert.ok(parsed.byteLength > 0);
  }
});

test("zararlı/ geçersiz görsel bağlantıları reddedilir", () => {
  assert.equal(parseImageDataUrl("javascript:alert(1)"), null);
  assert.equal(parseImageDataUrl("data:text/html;base64,PGI+"), null);
  assert.equal(parseImageDataUrl("https://evil.example/x.png"), null);
  assert.equal(parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz4="), null);
  assert.equal(parseImageDataUrl(""), null);
  assert.equal(parseImageDataUrl(undefined), null);
  assert.equal(parseImageDataUrl("data:image/png;base64,!!!"), null);
});

test("data URL bayt uzunluğu doğru hesaplanır", () => {
  assert.equal(dataUrlByteLength("data:image/png;base64,AQID"), 3); // 4 karakter → 3 bayt
  assert.equal(dataUrlByteLength("data:image/png;base64,AQ=="), 1);
  assert.equal(dataUrlByteLength("not-a-url"), -1);
});

/* ------------------------------ ürün girdisi -------------------------------- */

test("geçerli ürün kabul edilir", () => {
  const r = sanitizeProductInput(baseProduct());
  assert.equal(r.ok, true);
  assert.equal(r.data.shape, "panel-kemer");
  assert.equal(r.data.width, 120);
  assert.equal(r.data.plane, "wall");
});

test("ürün adı zorunludur", () => {
  assert.equal(sanitizeProductInput(baseProduct({ name: " " })).ok, false);
  assert.equal(sanitizeProductInput(baseProduct({ name: undefined })).ok, false);
});

test("yanlış ölçüler reddedilir", () => {
  for (const bad of [0, -10, "abc", null, Infinity]) {
    const r = sanitizeProductInput(baseProduct({ width: bad }));
    assert.equal(r.ok, false, `width=${String(bad)} reddedilmeli`);
  }
  assert.equal(sanitizeProductInput(baseProduct({ height: 0 })).ok, false);
  assert.equal(sanitizeProductInput(baseProduct({ width: 5000 })).ok, false);
});

test("yanlış kategori/alt kategori kimliği null'a düşer", () => {
  const r = sanitizeProductInput(baseProduct({ categoryId: "abc" }));
  assert.equal(r.ok, true);
  assert.equal(r.data.categoryId, null);
});

test("yanlış biçim/düzlem reddedilir", () => {
  assert.equal(sanitizeProductInput(baseProduct({ shape: "../evil" })).ok, false);
  assert.equal(sanitizeProductInput(baseProduct({ shape: "panel_kemer!" })).ok, false);
  assert.equal(sanitizeProductInput(baseProduct({ plane: "moon" })).ok, false);
});

test("SVG data URL görsel olarak reddedilir, PNG kabul edilir", () => {
  assert.equal(sanitizeProductInput(baseProduct({ imageUrl: "data:image/svg+xml;base64,PHN2Zz4=" })).ok, false);
  assert.equal(sanitizeProductInput(baseProduct({ imageUrl: PNG_1PX })).ok, true);
  assert.equal(sanitizeProductInput(baseProduct({ imageUrl: PNG_1PX })).data.imageUrl, PNG_1PX);
  assert.equal(sanitizeProductInput(baseProduct({ imageUrl: "javascript:alert(1)" })).ok, false);
});

test("20 MB üstü gömülü görsel reddedilir", () => {
  const huge = `data:image/png;base64,${"A".repeat(Math.ceil((20 * 1024 * 1024 + 1024) * (4 / 3)))}`;
  const r = sanitizeProductInput(baseProduct({ imageUrl: huge }));
  assert.equal(r.ok, false);
  assert.ok(r.error.includes("20 MB"));
});

test("kısmi PATCH yalnız gönderilen anahtarları döndürür", () => {
  const r = sanitizeProductPatch({ name: "Yeni Ad" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, { name: "Yeni Ad" });

  const p2 = sanitizeProductPatch({ width: 90, height: 90 });
  assert.deepEqual(p2.data, { width: 90, height: 90 });

  const p3 = sanitizeProductPatch({ isActive: false, price: 500 });
  assert.deepEqual(p3.data, { isActive: false, price: 500 });
});

test("PATCH geçersiz alan gönderirse reddedilir", () => {
  assert.equal(sanitizeProductPatch({ width: -1 }).ok, false);
  assert.equal(sanitizeProductPatch({ imageUrl: "javascript:x" }).ok, false);
  assert.equal(sanitizeProductPatch({ plane: "roof" }).ok, false);
});

/* --------------------------- liste hafifletme ------------------------------- */

test("imza kararlı ve değişime duyarlıdır", () => {
  const a = imageSig(PNG_1PX);
  assert.equal(a, imageSig(PNG_1PX));
  assert.notEqual(a, imageSig(PNG_1PX + "x"));
  assert.match(a, /^[0-9a-z]{1,12}$/);
});

test("küçük data URL listede gömülü kalır", () => {
  const out = lightweightProductImage({ id: 5, imageUrl: PNG_1PX });
  assert.equal(out, PNG_1PX);
});

test("büyük data URL sürüm imzalı bağlantıya dönüşür", () => {
  // 128 KB base64 → ~96 KB çözülmüş bayt > 64 KB sınır
  const big = `data:image/webp;base64,${"A".repeat(INLINE_IMAGE_URL_LIMIT * 2)}`;
  const out = lightweightProductImage({ id: 7, imageUrl: big });
  assert.match(out, /^\/api\/products\/7\/image\?v=[0-9a-z]+$/);
  assert.notEqual(imageSig(big), imageSig(big + "y"));
});

test("dış bağlantı ve boş görsel olduğu gibi kalır", () => {
  assert.equal(lightweightProductImage({ id: 7, imageUrl: "https://cdn.example/a.png" }), "https://cdn.example/a.png");
  assert.equal(lightweightProductImage({ id: 7, imageUrl: null }), null);
});

/* ------------------------------ konsept girdisi ----------------------------- */

test("konsept adı zorunludur", () => {
  assert.equal(sanitizeDesignPayload({ name: "" }).ok, false);
  const ok = sanitizeDesignPayload({
    name: "Doğum Günü Konsepti",
    room: { wallWidth: 400 },
    items: [],
  });
  assert.equal(ok.ok, true);
});

test("oda ayarları sınırlandırılır, duvar deseni doğrulanır", () => {
  const r = sanitizeDesignPayload({
    name: "x",
    room: {
      wallWidth: 99999,
      ambientLight: 42,
      gridVisible: "yes",
      wallPattern: { type: "yok", spacing: -3, thickness: 999, color: "red", strength: 5 },
      wallColor: "#f6f1ea",
      evilKey: "drop me",
    },
    items: [],
  });
  assert.equal(r.ok, true);
  const room = r.data.room;
  assert.equal(room.wallWidth, 5000);
  assert.equal(room.ambientLight, 2);
  assert.equal(room.gridVisible, false);
  assert.equal(room.wallPattern.type, "duz");
  assert.equal(room.wallPattern.spacing, 2); // negatif → en küçük geçerli aralık
  assert.ok(room.wallPattern.thickness <= room.wallPattern.spacing);
  assert.equal(room.wallPattern.color, "#b3a394");
  assert.equal(room.wallPattern.strength, 5 > 1 ? 1 : 5);
  assert.equal(room.wallColor, "#f6f1ea");
  assert.equal(room.evilKey, undefined);
});

test("sahnedeki zararlı nesneler atılır, alanlar sınırlandırılır", () => {
  const items = [
    { kind: "product", name: "Panel", imageUrl: "/api/products/3/image?v=abc", width: 99999, x: 1e12 },
    { kind: "text", name: "Yazı", text: "<script>x</script>", fontSize: 9999 },
    { kind: "iframe", name: "evil" },
    "not-an-object",
    { kind: "product", name: "Bad", imageUrl: "javascript:alert(1)" },
  ];
  const out = sanitizeSceneItems(items);
  assert.equal(out.length, 3);
  assert.equal(out[0].width, 5000);
  assert.equal(out[0].x, 20000);
  assert.equal(out[0].imageUrl, "/api/products/3/image?v=abc");
  // Yazılar React text düğümü olarak render edilir; ham metin korunur (en fazla 200 karakter).
  assert.equal(out[1].text, "<script>x</script>");
  assert.ok(out[1].fontSize <= 300);
  assert.equal(out[2].imageUrl, null);
});

test("500 nesne sınırı uygulanır", () => {
  const items = Array.from({ length: 550 }, (_, i) => ({ kind: "product", name: `p${i}` }));
  assert.equal(sanitizeSceneItems(items).length, 500);
});

/* --------------------- kaydedilen konseptin görsel kopyası ------------------ */

test("ürün görsel bağlantıları anlık kopyayla değiştirilir", async () => {
  const calls = [];
  const resolve = async (id) => {
    calls.push(id);
    if (id === 3) return PNG_1PX;
    return null; // silinmiş ürün
  };
  const items = [
    { kind: "product", imageUrl: "/api/products/3/image?v=aa" },
    { kind: "product", imageUrl: "/api/products/9/image?v=bb" },
    { kind: "product", imageUrl: PNG_1PX }, // zaten gömülü
    { kind: "text" }, // görseli yok
  ];
  const out = await snapshotDesignImages(items, resolve);
  assert.equal(out[0].imageUrl, PNG_1PX); // kopyalandı
  assert.equal(out[1].imageUrl, null); // ürün yok → bozulmaz, görsel düşer
  assert.equal(out[2].imageUrl, PNG_1PX); // dokunulmadı
  assert.equal(out[3].imageUrl, undefined);
  assert.deepEqual(calls, [3, 9]); // her ürün bir kez sorgulanır
});

test("aynı ürünü paylaşan nesneler önbellekten çözülür", async () => {
  let calls = 0;
  const resolve = async () => {
    calls += 1;
    return PNG_1PX;
  };
  const items = [
    { kind: "product", imageUrl: "/api/products/3/image?v=1" },
    { kind: "product", imageUrl: "/api/products/3/image?v=2" },
  ];
  const out = await snapshotDesignImages(items, resolve);
  assert.equal(calls, 1);
  assert.equal(out[0].imageUrl, PNG_1PX);
  assert.equal(out[1].imageUrl, PNG_1PX);
});
