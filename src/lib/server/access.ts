import { createHash, timingSafeEqual } from "node:crypto";

/** Initial single-operator studio protection, not a multi-user identity system. */
export function getAccessConfiguration() {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  return {
    required: process.env.VERCEL === "1"
      || process.env.REQUIRE_ADMIN_AUTH === "true"
      || Boolean(username || password),
    configured: username.length > 0 && username.length <= 128 && !username.includes(":")
      && password.length >= 16 && password.length <= 1024,
  };
}

export function verifyStudioAuthorization(header: string | null): boolean {
  if (!getAccessConfiguration().configured || !header || header.length > 4096) return false;
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (!match) return false;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 1) return false;
    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    const digest = (value: string) => createHash("sha256").update(value).digest();
    const userOK = timingSafeEqual(digest(user), digest(process.env.ADMIN_USERNAME?.trim() ?? ""));
    const passwordOK = timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD ?? ""));
    return userOK && passwordOK;
  } catch {
    return false;
  }
}
