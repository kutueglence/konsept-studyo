import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_WALL_PATTERN,
  WALL_PATTERN_OPTIONS,
  buildWallPatternLayer,
  normalizeWallPattern,
} from "../src/lib/editor/wall-pattern.ts";

const PATTERN_TYPES = ["kare", "tugla", "dikey", "yatay", "cita", "zikzak", "puantiye"];

function layerOf(overrides = {}, pxPerCm = 1) {
  return buildWallPatternLayer({ ...DEFAULT_WALL_PATTERN, ...overrides }, pxPerCm);
}

function svgOf(layer) {
  const m = /^url\("data:image\/svg\+xml,(.*)"\)$/.exec(layer.backgroundImage);
  assert.ok(m, "backgroundImage bir SVG data URL olmalı");
  return decodeURIComponent(m[1]);
}

function sizeOf(layer) {
  const m = /^([\d.]+)px ([\d.]+)px$/.exec(layer.backgroundSize);
  assert.ok(m, `backgroundSize beklenen biçimde değil: ${layer.backgroundSize}`);
  return { w: Number(m[1]), h: Number(m[2]) };
}

/* ------------------------------- seçenekler -------------------------------- */

test("sekiz hazır duvar tipi listelenir ve tekrarsızdır", () => {
  assert.equal(WALL_PATTERN_OPTIONS.length, 8);
  const values = WALL_PATTERN_OPTIONS.map((o) => o.value);
  assert.equal(new Set(values).size, 8);
  assert.ok(values.includes("duz"));
  for (const o of WALL_PATTERN_OPTIONS) {
    assert.ok(o.label.length > 0);
    assert.ok(o.spacing >= 2 && o.spacing <= 300, o.value);
    assert.ok(o.thickness >= 0.2 && o.thickness <= 60, o.value);
  }
});

test("varsayılan desen düz duvardır", () => {
  assert.equal(DEFAULT_WALL_PATTERN.type, "duz");
  assert.ok(DEFAULT_WALL_PATTERN.strength > 0 && DEFAULT_WALL_PATTERN.strength <= 1);
});

test("düz duvar desen katmanı üretmez", () => {
  assert.equal(layerOf({ type: "duz" }), null);
  assert.equal(buildWallPatternLayer(undefined, 1), null);
});

/* -------------------------------- üretim ----------------------------------- */

test("her desen tipi katman üretir ve belirginliği opaklığa çevirir", () => {
  for (const type of PATTERN_TYPES) {
    const layer = layerOf({ type, strength: 0.4 });
    assert.ok(layer, `${type} katman üretmeli`);
    assert.match(layer.backgroundImage, /^url\("data:image\/svg\+xml,/);
    assert.equal(layer.backgroundRepeat, "repeat");
    assert.equal(layer.backgroundPosition, "0 0");
    assert.equal(layer.opacity, 0.4);
  }
});

test("desen rengi URL güvenli biçimde kodlanır", () => {
  const layer = layerOf({ type: "tugla", color: "#a24b33" });
  assert.ok(layer.backgroundImage.includes(encodeURIComponent("#a24b33")));
  assert.ok(svgOf(layer).includes("#a24b33"));
});

test("karo boyutu gerçek santimetredir: 30 cm tuğla, 400 cm duvarda 1/13 genişlik", () => {
  const layer = layerOf({ type: "tugla", spacing: 30 });
  const { w } = sizeOf(layer);
  assert.equal(w, 30);
  // 400 cm duvar ≈ 13.33 tuğla → tuğla her zaman duvarın 1/13.33'ü kadardır.
  assert.ok(Math.abs(w / 400 - 30 / 400) < 1e-9);
  assert.ok(Math.abs(1 / (w / 400) - 13.333) < 0.01);
});

test("pxPerCm büyüdüğünde karo pikseli orantılı büyür (desen cm bazlıdır)", () => {
  const a = sizeOf(layerOf({ type: "kare", spacing: 40 }, 1));
  const b = sizeOf(layerOf({ type: "kare", spacing: 40 }, 2));
  assert.equal(b.w, a.w * 2);
  assert.equal(b.h, a.h * 2);
});

/* ------------------------------ desen geometrileri -------------------------- */

test("tuğla: karo iki sıra yüksekliğinde, alt sıra yarım tuğla kayar (şaşırtmalı derz)", () => {
  const layer = layerOf({ type: "tugla", spacing: 30, thickness: 1.5 });
  const { w, h } = sizeOf(layer);
  assert.equal(w, 30); // tuğla uzunluğu
  assert.equal(h, 30); // iki sıra × 15 cm
  const svg = svgOf(layer);
  const rects = svg.match(/<rect /g);
  assert.equal(rects.length, 2);
  // İkinci (alt) sıra negatif x'ten başlar → komşu karo ile yarım tuğla kayma.
  assert.match(svg, /<rect x="-\d/);
});

test("kare panel: karolarda çerçeve, karo kare ve çizgi kalınlığı korunur", () => {
  const layer = layerOf({ type: "kare", spacing: 40, thickness: 2 });
  const { w, h } = sizeOf(layer);
  assert.equal(w, 40);
  assert.equal(h, 40);
  const svg = svgOf(layer);
  assert.match(svg, /<rect [^>]*stroke-width="2"/);
  assert.ok(svg.includes('fill="none"'));
});

test("dikey ve yatay şerit: kalınlık = çizgi genişliği/yüksekliği", () => {
  const d = svgOf(layerOf({ type: "dikey", spacing: 14, thickness: 5 }));
  assert.match(d, /<rect x="0" y="0" width="5" height="14"/);
  const y = svgOf(layerOf({ type: "yatay", spacing: 14, thickness: 5 }));
  assert.match(y, /<rect x="0" y="0" width="14" height="5"/);
});

test("ahşap çıta: lath + açık/koyu kenar vurgusu", () => {
  const svg = svgOf(layerOf({ type: "cita", spacing: 9, thickness: 6 }));
  const rects = svg.match(/<rect /g);
  assert.equal(rects.length, 3);
  assert.ok(svg.includes('fill="#ffffff"'));
  assert.ok(svg.includes('fill="#000000"'));
});

test("zikzak: kırpılmayı tolere eden taşmalı yol üretir", () => {
  const svg = svgOf(layerOf({ type: "zikzak", spacing: 30, thickness: 1.5 }));
  assert.match(svg, /<path d="M -\d/);
  assert.match(svg, /L 15 /);
  assert.match(svg, /stroke-linejoin="miter"/);
});

test("puantiye: merkez + dört köşe noktası, yarıçap kalınlığın yarısı", () => {
  const svg = svgOf(layerOf({ type: "puantiye", spacing: 20, thickness: 6 }));
  const circles = svg.match(/<circle /g);
  assert.equal(circles.length, 5);
  assert.match(svg, /cx="10" cy="10" r="3"/);
  assert.match(svg, /cx="0" cy="0" r="3"/);
  assert.match(svg, /cx="20" cy="20" r="3"/);
});

test("çok uzaklaşıldığında (karo < 3 px) desen gizlenir", () => {
  assert.equal(layerOf({ type: "kare", spacing: 2 }, 1), null);
  assert.ok(layerOf({ type: "kare", spacing: 30 }, 0.2));
});

/* ------------------------------ normalizeWallPattern ----------------------- */

test("normalizeWallPattern geçersizleri düzeltir ve sınırlar", () => {
  const n = normalizeWallPattern({ type: "yok", spacing: -5, thickness: 999, color: "red", strength: 9 });
  assert.equal(n.type, "duz");
  assert.equal(n.spacing, 2); // negatif aralık en küçük geçerli değere çekilir
  assert.ok(n.thickness <= n.spacing);
  assert.equal(n.color, DEFAULT_WALL_PATTERN.color);
  assert.equal(n.strength, 1);

  const ok = normalizeWallPattern({ type: "tugla", spacing: 40, thickness: 2, color: "#123456", strength: 0.3 });
  assert.deepEqual(ok, { type: "tugla", spacing: 40, thickness: 2, color: "#123456", strength: 0.3 });

  assert.deepEqual(normalizeWallPattern(null), DEFAULT_WALL_PATTERN);
});

test("kalınlık deseni dolduracak kadar büyükse aralığa sıkıştırılır", () => {
  const n = normalizeWallPattern({ type: "dikey", spacing: 10, thickness: 50 });
  assert.equal(n.thickness, 10);
});
