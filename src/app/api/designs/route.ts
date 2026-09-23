import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { designs, products } from "@/db/schema";
import { sanitizeDesignPayload, snapshotDesignImages } from "@/lib/server/product-sanitize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const onlyTemplates = url.searchParams.get("templates") === "1";
  const rows = await db
    .select()
    .from(designs)
    .where(onlyTemplates ? eq(designs.isTemplate, true) : undefined)
    .orderBy(desc(designs.updatedAt));
  return NextResponse.json({ designs: rows });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }
  const result = sanitizeDesignPayload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // Sahnedeki /api/products/{id}/image bağlantıları, ürün görselinin o anki
  // anlık kopyasıyla değiştirilir → ürün sonradan değişse de konsept bozulmaz.
  const items = await snapshotDesignImages(result.data.items, async (productId) => {
    const [p] = await db
      .select({ imageUrl: products.imageUrl })
      .from(products)
      .where(eq(products.id, productId));
    return p?.imageUrl ?? null;
  });

  const [row] = await db
    .insert(designs)
    .values({
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
    })
    .returning();
  return NextResponse.json({ design: row }, { status: 201 });
}
