import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Exported environment variables win; .env.local wins over the sandbox .env.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  throw new Error("Şema kurulumu için DATABASE_URL_UNPOOLED veya DATABASE_URL tanımlanmalıdır.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
