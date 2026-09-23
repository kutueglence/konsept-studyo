import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { parseImageDataUrl } from "@/lib/server/product-sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Ürün görselini sürüm imzalı olarak sunar (`?v=`). Liste yanıtı hafif kalır;
 * görsel değişmediği sürece tarayıcı önbelleğinden gelir.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Geçersiz ürün." }, { status: 400 });
  }

  const [row] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, productId));
  if (!row?.imageUrl) {
    return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 404 });
  }

  const url = row.imageUrl;
  if (/^https?:\/\//i.test(url)) {
    return NextResponse.redirect(url);
  }

  const parsed = parseImageDataUrl(url);
  if (!parsed) {
    return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 404 });
  }

  return new Response(new Uint8Array(parsed.bytes), {
    headers: {
      "Content-Type": parsed.mime,
      "Content-Length": String(parsed.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
