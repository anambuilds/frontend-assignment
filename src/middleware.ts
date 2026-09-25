import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get("product_admin_token")?.value);
  if (request.nextUrl.pathname.startsWith("/products") && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (request.nextUrl.pathname === "/login" && hasToken) {
    return NextResponse.redirect(new URL("/products", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/login", "/products/:path*"] };
