import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";
import { getCategoryTree } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const tree = await getCategoryTree();
  return NextResponse.json({ categories: tree });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.type === "sub") {
    if (!body.categoryId || !body.name) {
      return NextResponse.json({ error: "Kategori ve isim zorunludur." }, { status: 400 });
    }
    const [row] = await db
      .insert(subcategories)
      .values({
        categoryId: Number(body.categoryId),
        name: String(body.name),
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();
    return NextResponse.json({ subcategory: row }, { status: 201 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "Kategori adı zorunludur." }, { status: 400 });
  }
  const [row] = await db
    .insert(categories)
    .values({
      name: String(body.name),
      icon: String(body.icon ?? "📦"),
      sortOrder: Number(body.sortOrder ?? 99),
    })
    .returning();
  return NextResponse.json({ category: row }, { status: 201 });
}
