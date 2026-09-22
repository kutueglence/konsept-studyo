import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const [row] = await db.select().from(quotes).where(eq(quotes.id, Number(id)));
  if (!row) return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  return NextResponse.json({ quote: row });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of ["status", "notes", "companyName", "customerName", "customerPhone"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (body.discount !== undefined) patch.discount = Number(body.discount);
  const [row] = await db.update(quotes).set(patch).where(eq(quotes.id, Number(id))).returning();
  return NextResponse.json({ quote: row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(quotes).where(eq(quotes.id, Number(id)));
  return NextResponse.json({ ok: true });
}
