import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { getAccessConfiguration, verifyStudioAuthorization } from "@/lib/server/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT_FILES = [
  "package.json", "package-lock.json", "tsconfig.json", "next.config.ts",
  "next-env.d.ts", "postcss.config.mjs", "eslint.config.mjs",
  "drizzle.deploy.config.ts", "vercel.json", ".env.example", ".gitignore",
  ".vercelignore", ".nvmrc", "DEPLOYMENT.md",
];

/** Source only. No .env, database records, build directories, tokens or uploads. */
export async function GET(request: Request) {
  const access = getAccessConfiguration();
  if (access.required && !verifyStudioAuthorization(request.headers.get("authorization"))) {
    return Response.json({ error: "Bu işlem için yönetici erişimi gereklidir." }, { status: 401 });
  }

  try {
    const archive: Record<string, Uint8Array> = {};
    let totalBytes = 0;

    // next.config.ts explicitly traces the export allowlist. Do not infer all
    // project files from these runtime paths (which could pull in .env/builds).
    const addFile = async (relativePath: string) => {
      const absolute = path.join(/*turbopackIgnore: true*/ process.cwd(), relativePath);
      const info = await lstat(/*turbopackIgnore: true*/ absolute);
      if (!info.isFile() || info.isSymbolicLink()) return;
      totalBytes += info.size;
      if (totalBytes > 12_000_000 || Object.keys(archive).length >= 500) {
        throw new Error("Source archive limit exceeded");
      }
      archive[`konsept-studyo/${relativePath.split(path.sep).join("/")}`] = await readFile(/*turbopackIgnore: true*/ absolute);
    };

    const walk = async (directory: string, extensions: RegExp) => {
      const absolute = path.join(/*turbopackIgnore: true*/ process.cwd(), directory);
      let entries;
      try { entries = await readdir(/*turbopackIgnore: true*/ absolute, { withFileTypes: true }); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
        throw error;
      }
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(relative, extensions);
        else if (entry.isFile() && extensions.test(entry.name)) await addFile(relative);
      }
    };

    for (const name of ROOT_FILES) await addFile(name);
    await walk("src", /\.(ts|tsx|css)$/i);
    await walk("drizzle", /\.(sql|json)$/i);
    await walk("public", /\.(svg|png|jpe?g|webp|avif|ico|woff2?)$/i);

    for (const required of ["src/app/page.tsx", "src/db/schema.ts", "drizzle/meta/_journal.json"]) {
      if (!archive[`konsept-studyo/${required}`]) throw new Error("Source files unavailable");
    }
    const zipped = zipSync(archive, { level: 6 });
    if (zipped.byteLength > 4_000_000) {
      return Response.json({ error: "Paket indirme sınırını aşıyor. Kaynakları Git deponuzdan indirin." }, { status: 413 });
    }

    return new Response(new Uint8Array(zipped), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="konsept-studyo-yayin-paketi.zip"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({
      error: "Yayın paketi oluşturulamadı. Kaynak dosyalar bu sunucuda mevcut değilse Git deponuzdan indirin.",
    }, { status: 503 });
  }
}
