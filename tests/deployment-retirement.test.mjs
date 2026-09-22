import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import nextConfig from "../next.config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(filename));
    else if (/\.tsx?$/.test(entry.name)) files.push(filename);
  }
  return files;
}

test("old deployment-guide bookmarks redirect to the admin dashboard", async () => {
  const redirects = await nextConfig.redirects();
  assert.deepEqual(redirects.find(rule => rule.source === "/yonetim/yayin"), {
    source: "/yonetim/yayin",
    destination: "/yonetim",
    permanent: true,
  });
});

test("app source contains no deployment-guide links, banner or download references", async () => {
  const retiredFeature = /Kalıcı Yayın|Stüdyonuzu kendi adresinizde yayınlayın|\/yonetim\/yayin|\/api\/deployment\/source|DeploymentActions/;
  for (const filename of await sourceFiles(path.join(root, "src"))) {
    assert.doesNotMatch(await readFile(filename, "utf8"), retiredFeature, filename);
  }
});

test("guide page, source-download API and unused client component are removed", async () => {
  for (const filename of [
    "src/app/yonetim/yayin/page.tsx",
    "src/app/api/deployment/source/route.ts",
    "src/components/admin/DeploymentActions.tsx",
  ]) {
    await assert.rejects(stat(path.join(root, filename)), { code: "ENOENT" });
  }
});

test("source-archive tracing and the ZIP-only dependency are no longer needed", async () => {
  assert.equal(nextConfig.outputFileTracingIncludes?.["/api/deployment/source"], undefined);
  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.dependencies.fflate, undefined);
});

test("operational admin screens remain in the shared desktop/mobile navigation", async () => {
  const layout = await readFile(path.join(root, "src/app/yonetim/layout.tsx"), "utf8");
  for (const route of [
    "/yonetim",
    "/yonetim/urunler",
    "/yonetim/kategoriler",
    "/yonetim/konseptler",
    "/yonetim/teklifler",
    "/yonetim/musteriler",
  ]) {
    assert.ok(layout.includes(`href: "${route}"`), `${route} must remain in navigation`);
    assert.ok((await stat(path.join(root, "src/app", route, "page.tsx"))).isFile());
  }
  assert.equal(layout.match(/NAV\.map\(/g)?.length, 2, "desktop and mobile must both use the shared menu");
});
