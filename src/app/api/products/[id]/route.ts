import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

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
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  const numberKeys = ["width", "height", "depth", "price", "stock"];
  const passKeys = [
    "name",
    "imageUrl",
    "modelUrl",
    "shape",
    "color",
    "material",
    "description",
    "plane",
    "tags",
  ];
  for (const key of numberKeys) {
    if (body[key] !== undefined) patch[key] = Number(body[key]);
  }
  for (const key of passKeys) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (body.categoryId !== undefined) patch.categoryId = body.categoryId ? Number(body.categoryId) : null;
  if (body.subcategoryId !== undefined)
    patch.subcategoryId = body.subcategoryId ? Number(body.subcategoryId) : null;
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
  if (body.colorEditable !== undefined) patch.colorEditable = Boolean(body.colorEditable);

  const [row] = await db.update(products).set(patch).where(eq(products.id, Number(id))).returning();
  return NextResponse.json({ product: row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
