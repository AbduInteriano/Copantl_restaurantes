import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminSlug, isLegacyAdminPath } from "@/lib/admin-path";

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = getAdminSlug();

  if (slug !== "admin" && isLegacyAdminPath(pathname)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    const internal = pathname.replace(`/${slug}`, "/admin") || "/admin";
    const url = request.nextUrl.clone();
    url.pathname = internal;
    return applySecurityHeaders(NextResponse.rewrite(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
