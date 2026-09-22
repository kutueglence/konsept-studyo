import { NextResponse } from "next/server";
import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId");
  const subcategoryId = url.searchParams.get("subcategoryId");
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

  return NextResponse.json({ products: rows });
}

function sanitize(body: Record<string, unknown>) {
  const num = (v: unknown, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };
  return {
    name: String(body.name ?? "").trim(),
    categoryId: body.categoryId ? Number(body.categoryId) : null,
    subcategoryId: body.subcategoryId ? Number(body.subcategoryId) : null,
    imageUrl: (body.imageUrl as string) || null,
    modelUrl: (body.modelUrl as string) || null,
    shape: String(body.shape ?? "kutu"),
    width: num(body.width, 50),
    height: num(body.height, 50),
    depth: num(body.depth, 10),
    color: String(body.color ?? "#f0abfc"),
    colorEditable: body.colorEditable !== false,
    material: (body.material as string) || null,
    price: num(body.price, 0),
    stock: Math.round(num(body.stock, 0)),
    description: (body.description as string) || null,
    plane: String(body.plane ?? "wall"),
    tags: (body.tags as string) || null,
    isActive: body.isActive !== false,
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = sanitize(body);
  if (!data.name) {
    return NextResponse.json({ error: "Ürün adı zorunludur." }, { status: 400 });
  }
  const [row] = await db.insert(products).values(data).returning();
  return NextResponse.json({ product: row }, { status: 201 });
}
