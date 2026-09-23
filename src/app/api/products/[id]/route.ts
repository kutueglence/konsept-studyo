import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { sanitizeProductPatch } from "@/lib/server/product-sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const [row] = await db.select().from(products).where(eq(products.id, Number(id)));
  if (!row) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  return NextResponse.json({ product: row });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }
  const result = sanitizeProductPatch(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const patch = result.data as Record<string, unknown>;

  if (patch.categoryId !== undefined && patch.categoryId !== null) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, patch.categoryId as number));
    if (!cat) return NextResponse.json({ error: "Seçili kategori bulunamadı." }, { status: 400 });
  }
  if (patch.subcategoryId !== undefined && patch.subcategoryId !== null) {
    const [sub] = await db
      .select({ id: subcategories.id, categoryId: subcategories.categoryId })
      .from(subcategories)
      .where(eq(subcategories.id, patch.subcategoryId as number));
    const expected = (patch.categoryId as number | null | undefined) ?? undefined;
    if (!sub || (expected !== undefined && sub.categoryId !== expected)) {
      return NextResponse.json({ error: "Seçili alt kategori bulunamadı." }, { status: 400 });
    }
  }

  patch.updatedAt = new Date();
  const [row] = await db.update(products).set(patch).where(eq(products.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  return NextResponse.json({ product: row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
