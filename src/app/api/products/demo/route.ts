import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { DEMO_PRODUCTS } from "@/lib/seed-data";
import { getCategoryTree } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Opsiyonel demo ürün paketini yükler (yönetici tetikler). */
export async function POST() {
  const tree = await getCategoryTree();
  const existing = await db.select({ name: products.name }).from(products);
  const existingNames = new Set(existing.map((p) => p.name));

  const rows = DEMO_PRODUCTS.filter((p) => !existingNames.has(p.name)).map((p) => {
    const cat = tree.find((c) => c.name === p.category);
    const sub = cat?.subs.find((s) => s.name === p.sub);
    return {
      name: p.name,
      categoryId: cat?.id ?? null,
      subcategoryId: sub?.id ?? null,
      shape: p.shape,
      width: p.width,
      height: p.height,
      depth: p.depth,
      color: p.color,
      material: p.material ?? null,
      price: p.price,
      stock: p.stock,
      plane: p.plane,
      description: p.description ?? null,
      tags: `${p.category}, ${p.sub}`,
    };
  });

  if (rows.length) await db.insert(products).values(rows);
  return NextResponse.json({ inserted: rows.length });
}

/** Tüm ürünleri temizler. */
export async function DELETE() {
  await db.delete(products);
  return NextResponse.json({ ok: true });
}
