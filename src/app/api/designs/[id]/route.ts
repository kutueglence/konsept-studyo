import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { designs, products } from "@/db/schema";
import { sanitizeDesignPayload, snapshotDesignImages } from "@/lib/server/product-sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const [row] = await db.select().from(designs).where(eq(designs.id, Number(id)));
  if (!row) return NextResponse.json({ error: "Konsept bulunamadı." }, { status: 404 });
  return NextResponse.json({ design: row });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }
  const result = sanitizeDesignPayload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const items = await snapshotDesignImages(result.data.items, async (productId) => {
    const [p] = await db
      .select({ imageUrl: products.imageUrl })
      .from(products)
      .where(eq(products.id, productId));
    return p?.imageUrl ?? null;
  });

  const [row] = await db
    .update(designs)
    .set({
      name: result.data.name,
      customerName: result.data.customerName,
      customerPhone: result.data.customerPhone,
      eventType: result.data.eventType,
      eventDate: result.data.eventDate,
      room: result.data.room,
      items,
      total: result.data.total,
      notes: result.data.notes,
      isTemplate: result.data.isTemplate,
      coverColor: result.data.coverColor,
      updatedAt: new Date(),
    })
    .where(eq(designs.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Konsept bulunamadı." }, { status: 404 });
  return NextResponse.json({ design: row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(designs).where(eq(designs.id, Number(id)));
  return NextResponse.json({ ok: true });
}
