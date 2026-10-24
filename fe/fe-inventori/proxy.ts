import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, decodeToken, isExpired } from "@/lib/auth";
import { homeFor } from "@/lib/redirect";

const PROTECTED = ["/admin", "/my", "/scan"];

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const user = token && !isExpired(token) ? decodeToken(token) : null;

  if (path === "/") return NextResponse.redirect(new URL(homeFor(user?.role), req.url));
  if (!PROTECTED.some((p) => under(path, p))) return NextResponse.next();

  if (!user) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (under(path, "/admin") && user.role !== "admin") return NextResponse.redirect(new URL("/my", req.url));
  if (under(path, "/my") && user.role !== "technician") return NextResponse.redirect(new URL("/admin", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/", "/admin/:path*", "/my/:path*", "/scan/:path*"] };
