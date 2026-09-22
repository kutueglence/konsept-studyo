import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { designs } from "@/db/schema";

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
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of [
    "name",
    "customerName",
    "customerPhone",
    "eventType",
    "eventDate",
    "room",
    "items",
    "notes",
    "coverColor",
  ]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (body.total !== undefined) patch.total = Number(body.total);
  if (body.isTemplate !== undefined) patch.isTemplate = Boolean(body.isTemplate);

  const [row] = await db.update(designs).set(patch).where(eq(designs.id, Number(id))).returning();
  return NextResponse.json({ design: row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(designs).where(eq(designs.id, Number(id)));
  return NextResponse.json({ ok: true });
}
