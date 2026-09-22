import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  return NextResponse.json({ quotes: rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const [row] = await db
    .insert(quotes)
    .values({
      designId: body.designId ? Number(body.designId) : null,
      companyName: body.companyName || "Konsept Kiralama",
      customerName: body.customerName ?? null,
      customerPhone: body.customerPhone ?? null,
      eventType: body.eventType ?? null,
      eventDate: body.eventDate ?? null,
      conceptName: body.conceptName ?? null,
      lines: body.lines ?? [],
      total: Number(body.total ?? 0),
      discount: Number(body.discount ?? 0),
      notes: body.notes ?? null,
      status: body.status ?? "taslak",
      preview: body.preview ?? null,
    })
    .returning();
  return NextResponse.json({ quote: row }, { status: 201 });
}
