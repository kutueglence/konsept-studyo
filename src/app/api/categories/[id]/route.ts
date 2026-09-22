import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const numericId = Number(id);
  if (body.type === "sub") {
    const [row] = await db
      .update(subcategories)
      .set({ name: String(body.name) })
      .where(eq(subcategories.id, numericId))
      .returning();
    return NextResponse.json({ subcategory: row });
  }
  const [row] = await db
    .update(categories)
    .set({
      ...(body.name ? { name: String(body.name) } : {}),
      ...(body.icon ? { icon: String(body.icon) } : {}),
    })
    .where(eq(categories.id, numericId))
    .returning();
  return NextResponse.json({ category: row });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  const numericId = Number(id);
  const url = new URL(request.url);
  if (url.searchParams.get("type") === "sub") {
    await db.delete(subcategories).where(eq(subcategories.id, numericId));
    return NextResponse.json({ ok: true });
  }
  await db.delete(subcategories).where(eq(subcategories.categoryId, numericId));
  await db.delete(categories).where(eq(categories.id, numericId));
  return NextResponse.json({ ok: true });
}
