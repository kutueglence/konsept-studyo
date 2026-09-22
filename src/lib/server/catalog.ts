import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";
import { SEED_CATEGORIES } from "@/lib/seed-data";

let seedChecked = false;
let seedPromise: Promise<void> | undefined;

/**
 * Only categories are bootstrapped. Products are always entered by the owner.
 * Transaction-scoped locking prevents duplicate trees across serverless instances.
 */
export async function ensureCategorySeed() {
  if (seedChecked) return;
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(2145039001)`);
      const existing = await tx.select({ id: categories.id }).from(categories).limit(1);
      if (existing.length) return;

      for (const [sortOrder, cat] of SEED_CATEGORIES.entries()) {
        const [created] = await tx.insert(categories)
          .values({ name: cat.name, icon: cat.icon, sortOrder }).returning();
        if (cat.subs.length) {
          await tx.insert(subcategories).values(
            cat.subs.map((name, index) => ({ categoryId: created.id, name, sortOrder: index })),
          );
        }
      }
    }).then(() => {
      seedChecked = true;
    }).catch((error: unknown) => {
      seedPromise = undefined;
      throw error;
    });
  }
  await seedPromise;
}

export async function getCategoryTree() {
  await ensureCategorySeed();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const subs = await db.select().from(subcategories).orderBy(asc(subcategories.sortOrder), asc(subcategories.id));
  return cats.map((c) => ({ ...c, subs: subs.filter((s) => s.categoryId === c.id) }));
}

export async function findCategoryIdByName(name: string) {
  const [row] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  return row?.id ?? null;
}
