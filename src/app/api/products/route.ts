import { NextResponse } from "next/server";
import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { lightweightProductImage, sanitizeProductInput } from "@/lib/server/product-sanitize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId");
  const subcategoryId = url.searchParams.get("subcategoryId");
  // Yönetim paneli (all=1) ham görselleri alır; stüdyo listesi hafiftir —
  // büyük görseller /api/products/{id}/image üzerinden sürüm imzasıyla sunulur.
  const includeInactive = url.searchParams.get("all") === "1";

  const filters: SQL[] = [];
  if (!includeInactive) filters.push(eq(products.isActive, true));
  if (categoryId) filters.push(eq(products.categoryId, Number(categoryId)));
  if (subcategoryId) filters.push(eq(products.subcategoryId, Number(subcategoryId)));
  if (search) {
    const like = `%${search}%`;
    const cond = or(
      ilike(products.name, like),
      ilike(products.description, like),
      ilike(products.tags, like),
      ilike(products.material, like),
    );
    if (cond) filters.push(cond);
  }

  const rows = await db
    .select()
    .from(products)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(products.categoryId), asc(products.name));

  return NextResponse.json({
    products: includeInactive ? rows : rows.map((r) => ({ ...r, imageUrl: lightweightProductImage(r) })),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }
  const result = sanitizeProductInput(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const data = result.data;

  if (data.categoryId !== null) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId));
    if (!cat) {
      return NextResponse.json({ error: "Seçili kategori bulunamadı." }, { status: 400 });
    }
  }
  if (data.subcategoryId !== null) {
    const [sub] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.subcategoryId));
    if (!sub) {
      return NextResponse.json({ error: "Seçili alt kategori bulunamadı." }, { status: 400 });
    }
  }

  const [row] = await db.insert(products).values(data).returning();
  return NextResponse.json({ product: row }, { status: 201 });
}
