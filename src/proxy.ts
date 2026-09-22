import { NextRequest, NextResponse } from "next/server";
import { getAccessConfiguration, verifyStudioAuthorization } from "@/lib/server/access";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function denied(request: NextRequest, message: string, status: number) {
  const headers: Record<string, string> = { ...PRIVATE_HEADERS };
  if (status === 401) {
    headers["WWW-Authenticate"] = 'Basic realm="Konsept Studyo", charset="UTF-8"';
  }
  return request.nextUrl.pathname.startsWith("/api/")
    ? NextResponse.json({ error: message }, { status, headers })
    : new NextResponse(message, { status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
}

export function proxy(request: NextRequest) {
  // Health checks intentionally expose only an ok boolean, not business records.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();

  const access = getAccessConfiguration();
  if (!access.required) return NextResponse.next(); // isolated sandbox preview only

  if (!access.configured) {
    return denied(request,
      "Canlı yayın kurulumu tamamlanmadı. Projenin Environment Variables bölümünde ADMIN_USERNAME ve en az 16 karakterli ADMIN_PASSWORD tanımlayıp yeniden yayınlayın. Şifreleri kaynak koda veya sohbete yazmayın.",
      503,
    );
  }

  if (!verifyStudioAuthorization(request.headers.get("authorization"))) {
    return denied(request, "Bu özel stüdyoya erişmek için yönetici kullanıcı adı ve parolası gereklidir.", 401);
  }

  // Browsers cache Basic credentials: reject cross-origin state-changing requests.
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const requestHost = request.headers.get("host") ?? request.nextUrl.host;
    let sameOrigin = true;
    if (origin) {
      try { sameOrigin = new URL(origin).host === requestHost; }
      catch { sameOrigin = false; }
    }
    if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
      return denied(request, "Başka bir siteden yapılan değişiklik isteği reddedildi.", 403);
    }
  }

  return NextResponse.next({ headers: PRIVATE_HEADERS });
}

// Pages, RSC navigation and every business API are protected. Static assets remain accessible.
export const config = {
  matcher: ["/", "/tasarim/:path*", "/konseptler/:path*", "/teklif/:path*", "/yonetim/:path*", "/api/:path*"],
};
