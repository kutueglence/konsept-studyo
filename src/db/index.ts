import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  // Neon TLS settings come from its connection URL; do not disable verification.
  // Register only on Vercel; local PostgreSQL keeps the standard pg lifecycle.
  if (process.env.VERCEL === "1") attachDatabasePool(pool);
  pool.on("error", (error: Error & { code?: string }) => {
    // Never log a connection string or authentication material.
    console.error("PostgreSQL havuz bağlantısı kapandı.", { code: error.code ?? "CONNECTION_ERROR" });
  });
  return pool;
}

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? createPool(databaseUrl);
globalForDb.__arenaNextJsPostgresqlPool = pool;
export const db = drizzle(pool);
