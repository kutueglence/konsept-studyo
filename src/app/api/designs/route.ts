import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { designs } from "@/db/schema";

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
  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Konsept adı zorunludur." }, { status: 400 });
  }
  const [row] = await db
    .insert(designs)
    .values({
      name: String(body.name),
      customerName: body.customerName ?? null,
      customerPhone: body.customerPhone ?? null,
      eventType: body.eventType ?? null,
      eventDate: body.eventDate ?? null,
      room: body.room ?? {},
      items: body.items ?? [],
      total: Number(body.total ?? 0),
      notes: body.notes ?? null,
      isTemplate: Boolean(body.isTemplate),
      coverColor: body.coverColor ?? "#fde68a",
    })
    .returning();
  return NextResponse.json({ design: row }, { status: 201 });
}
