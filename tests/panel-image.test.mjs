import assert from "node:assert/strict";
import test from "node:test";
import {
  PANEL_SHAPE_OPTIONS,
  computeDrawRect,
  computeRenderTargetSize,
  isHeightLockedPanelShape,
  isPanelShape,
  panelShapePathD,
  validatePanelImageFile,
} from "../src/lib/editor/panel-image.ts";

/* ------------------------------ panel biçimleri ---------------------------- */

test("altı panel biçimi tanımlıdır", () => {
  assert.equal(PANEL_SHAPE_OPTIONS.length, 6);
  const values = PANEL_SHAPE_OPTIONS.map((o) => o.value);
  assert.deepEqual(values, [
    "panel-dikdortgen",
    "panel-kemer",
    "panel-yuvarlak",
    "panel-oval",
    "panel-kare",
    "panel-dalga",
  ]);
});

test("her biçim kapalı bir SVG yolu üretir", () => {
  for (const o of PANEL_SHAPE_OPTIONS) {
    const d = panelShapePathD(o.value, 200, 300);
    assert.match(d, /^M /, o.value);
    assert.match(d, /Z$/, o.value);
  }
});

test("dikdörtgen yay içermez; kemer tepesi yarım çemberle çizilir", () => {
  const rect = panelShapePathD("panel-dikdortgen", 200, 300);
  assert.ok(!rect.includes("A "), "dikdörtgende yay olmamalı");
  assert.match(rect, /L 200 29\d/); // sağ kenar boyunca iner

  const arch = panelShapePathD("panel-kemer", 200, 300);
  // kemer yarıçapı = genişlik/2 = 100; yanlar kemer altından zemine iner
  assert.match(arch, /A 100 100 0 0 1 200 100/);
  assert.match(arch, /M 0 300 L 0 100/);
  assert.match(arch, /L 200 300/);
});;

test("yuvarlak ve oval tam kaplayan eğriler üretir", () => {
  const circle = panelShapePathD("panel-yuvarlak", 180, 180);
  assert.match(circle, /a 90 90 0 1 1 180 0/);
  const oval = panelShapePathD("panel-oval", 200, 120);
  assert.match(oval, /a 100 60 0 1 1 200 0/);
});

test("dalgalı panel kenarları yumru yaylarla kaplıdır", () => {
  const d = panelShapePathD("panel-dalga", 200, 260);
  const arcs = d.match(/A /g) ?? [];
  assert.ok(arcs.length >= 8, `dalga en az 8 yay içermeli, ${arcs.length} var`);
});

test("yuvarlak ve karede yükseklik genişliğe kilitlenir", () => {
  assert.equal(isHeightLockedPanelShape("panel-yuvarlak"), true);
  assert.equal(isHeightLockedPanelShape("panel-kare"), true);
  assert.equal(isHeightLockedPanelShape("panel-dikdortgen"), false);
  assert.equal(isHeightLockedPanelShape("panel-kemer"), false);
  assert.equal(isHeightLockedPanelShape("panel-oval"), false);
  assert.equal(isHeightLockedPanelShape("panel-dalga"), false);
});

test("isPanelShape yalnız geçerli anahtarları kabul eder", () => {
  assert.equal(isPanelShape("panel-kemer"), true);
  assert.equal(isPanelShape("kutu"), false);
  assert.equal(isPanelShape("../../evil"), false);
  assert.equal(isPanelShape(42), false);
});

/* ------------------------------ kırpma / odak ------------------------------ */

test("cover: yatay odak 0 solda, 1 sağda, 0.5 ortada kalır", () => {
  // kaynak 1000×500 (geniş), kare tuval → yatayda kırpılır
  const left = computeDrawRect(1000, 500, 500, 500, "cover", 0, 0.5);
  assert.equal(left.sx, 0);
  assert.equal(left.sw, 500);
  assert.equal(left.sh, 500);
  assert.equal(left.dw, 500);
  assert.equal(left.dh, 500);

  const right = computeDrawRect(1000, 500, 500, 500, "cover", 1, 0.5);
  assert.equal(right.sx, 500);

  const mid = computeDrawRect(1000, 500, 500, 500, "cover", 0.5, 0.5);
  assert.equal(mid.sx, 250);
});

test("cover: dikey odak 0 üstte, 1 altta kalır", () => {
  const top = computeDrawRect(500, 1000, 500, 500, "cover", 0.5, 0);
  assert.equal(top.sy, 0);
  assert.equal(top.sw, 500);
  assert.equal(top.sh, 500);

  const bottom = computeDrawRect(500, 1000, 500, 500, "cover", 0.5, 1);
  assert.equal(bottom.sy, 500);
});

test("cover: kaynak tuval oranındaysa kırpma olmaz", () => {
  const r = computeDrawRect(800, 600, 400, 300, "cover", 1, 1);
  assert.equal(r.sx, 0);
  assert.equal(r.sy, 0);
  assert.equal(r.sw, 800);
  assert.equal(r.sh, 600);
});

test("contain: kırpma yok, ortalanır, oran korunur", () => {
  const r = computeDrawRect(1000, 500, 500, 500, "contain", 1, 1);
  assert.equal(r.sx, 0);
  assert.equal(r.sy, 0);
  assert.equal(r.sw, 1000);
  assert.equal(r.sh, 500);
  assert.equal(r.dw, 500);
  assert.equal(r.dh, 250);
  assert.equal(r.dx, 0);
  assert.equal(r.dy, 125);
});

test("odak değerleri 0–1 aralığına sıkıştırılır", () => {
  const beyond = computeDrawRect(1000, 500, 500, 500, "cover", 99, -99);
  assert.equal(beyond.sx, 500);
  const below = computeDrawRect(1000, 500, 500, 500, "cover", -5, 5);
  assert.equal(below.sx, 0);
});

/* --------------------------- hedef çözünürlük ------------------------------ */

test("büyük kaynak ideal çözünürlüğe küçültülür, oran korunur, uyarı yok", () => {
  const t = computeRenderTargetSize(4000, 3000, 120, 120);
  assert.equal(t.w, 1600);
  assert.equal(t.h, 1600);
  assert.equal(t.warning, false);
});

test("küçük kaynak asla büyütülmez — uyarı gösterilir", () => {
  const t = computeRenderTargetSize(600, 600, 180, 180);
  assert.equal(t.w, 600);
  assert.equal(t.h, 600);
  assert.equal(t.warning, true);
});

test("uzun kenar her zaman maxSide ile sınırlıdır ve panel oranı korunur", () => {
  const t = computeRenderTargetSize(4000, 4000, 120, 200); // oran 0.6
  assert.equal(Math.max(t.w, t.h), 1600);
  assert.ok(Math.abs(t.w / t.h - 0.6) < 0.01, `oran ${t.w}/${t.h}`);
  assert.equal(t.warning, false);

  // kaynak dar/uzun: 800×600 → panel 120×200 → büyütme yok: 360×600
  const s = computeRenderTargetSize(800, 600, 120, 200);
  assert.ok(Math.abs(s.w / s.h - 0.6) < 0.01);
  assert.ok(s.w <= 360.5 && s.h <= 600.5, `büyütme yapılmamalı: ${s.w}×${s.h}`);
  assert.equal(s.warning, true);
});

test("yuvarlak panelde hedef yine karedir (yükseklik kilidi formda uygulanır)", () => {
  const t = computeRenderTargetSize(3000, 3000, 180, 180);
  assert.equal(t.w, t.h);
});

/* ------------------------------ yükleme kuralları --------------------------- */

test("yalnız PNG/JPG/WebP kabul edilir; SVG ve GIF reddedilir", () => {
  assert.deepEqual(validatePanelImageFile({ type: "image/png", size: 1024 }), { ok: true });
  assert.deepEqual(validatePanelImageFile({ type: "image/jpeg", size: 1024 }), { ok: true });
  assert.deepEqual(validatePanelImageFile({ type: "image/webp", size: 1024 }), { ok: true });

  const svg = validatePanelImageFile({ type: "image/svg+xml", size: 1024 });
  assert.equal(svg.ok, false);
  assert.ok(svg.error.includes("PNG"));

  const gif = validatePanelImageFile({ type: "image/gif", size: 1024 });
  assert.equal(gif.ok, false);
});

test("20 MB üstü görseller reddedilir", () => {
  const big = validatePanelImageFile({ type: "image/png", size: 20 * 1024 * 1024 + 1 });
  assert.equal(big.ok, false);
  assert.ok(big.error.includes("20 MB"));
  assert.deepEqual(validatePanelImageFile({ type: "image/png", size: 20 * 1024 * 1024 }), { ok: true });
});

test("türü/boyutu okunamayan dosya reddedilir", () => {
  assert.equal(validatePanelImageFile({ type: "", size: 100 }).ok, false);
  assert.equal(validatePanelImageFile({ type: "image/png", size: 0 }).ok, false);
  assert.equal(validatePanelImageFile({ type: "image/png" }).ok, false);
});
