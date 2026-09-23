import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBackdropPlacement,
  isBackdropCategoryName,
} from "../src/lib/editor/backdrop.ts";

/* ---------------------------- kategori eşleşmesi ---------------------------- */

test("arka fon kategorisi ada göre tanınır", () => {
  assert.equal(isBackdropCategoryName("Konsept / Arka Fon Panelleri"), true);
  assert.equal(isBackdropCategoryName("arka fon"), true);
  assert.equal(isBackdropCategoryName("ARKA FON PANELLERİ"), true);
  assert.equal(isBackdropCategoryName("Balonlar"), false);
  assert.equal(isBackdropCategoryName(""), false);
  assert.equal(isBackdropCategoryName(null), false);
  assert.equal(isBackdropCategoryName(undefined), false);
  assert.equal(isBackdropCategoryName(42), false);
});

/* ------------------------------ otomatik yerleşim --------------------------- */

test("duvardan büyük panel duvara sığacak kadar küçülür, ortalanır ve zemine oturur", () => {
  // 500×300 panel, 400×250 duvar → ölçek 0.8 → 400×240
  const p = computeBackdropPlacement(400, 250, 500, 300);
  assert.equal(p.scale, 0.8);
  assert.equal(p.x, 200); // yatayda ortalanır
  assert.equal(p.y, 120); // 240/2 → alt kenar zeminde
  assert.equal(p.z, 0); // duvara yaslanır
});

test("küçük panel büyütülmez", () => {
  const p = computeBackdropPlacement(400, 250, 100, 100);
  assert.equal(p.scale, 1);
  assert.equal(p.y, 50);
  assert.equal(p.x, 200);
});

test("hem geniş hem uzun panel iki eksende de sığar", () => {
  const p = computeBackdropPlacement(400, 250, 600, 600);
  assert.equal(p.scale, Math.round((250 / 600) * 1000) / 1000);
  assert.equal(p.y, 125); // yükseklik tam duvara denk gelir
  assert.equal(p.x, 200);
});

test("bırakılan noktaya uyar ama duvardan taşarsa kenarda tutulur", () => {
  // 100 cm panel, 400 cm duvar → merkez [50, 350] arasında serbest
  assert.equal(computeBackdropPlacement(400, 250, 100, 100, 200).x, 200);
  assert.equal(computeBackdropPlacement(400, 250, 100, 100, 10).x, 50);
  assert.equal(computeBackdropPlacement(400, 250, 100, 100, 390).x, 350);
  assert.equal(computeBackdropPlacement(400, 250, 100, 100, 60).x, 60);
});

test("duvarı tam dolduran panel tek geçerli noktada tutulur", () => {
  const p = computeBackdropPlacement(400, 250, 500, 300, 30);
  assert.equal(p.scale, 0.8);
  assert.equal(p.x, 200); // 400 cm genişlikte tek geçerli konum
});

test("bırakış noktası verilmezse yatayda ortalanır", () => {
  assert.equal(computeBackdropPlacement(400, 250, 100, 100).x, 200);
  assert.equal(computeBackdropPlacement(600, 250, 100, 100, undefined).x, 300);
});

test("geçersiz girdiler güvenli biçimde düzeltilir", () => {
  const p = computeBackdropPlacement(NaN, NaN, -50, "x", "yok");
  assert.ok(Number.isFinite(p.x));
  assert.ok(Number.isFinite(p.y));
  assert.ok(p.scale > 0 && p.scale <= 1);
  assert.equal(p.z, 0);
});
