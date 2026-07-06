import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { JWT_COOKIE_NAME } from "@/constants";

const PUBLIC_ROUTES  = ["/login", "/signup"];
const CREATOR_ROUTES = ["/creator"];
const ADMIN_ROUTES   = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;

  // Redirect logged-in users away from auth pages
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (user) {
      if (user.role === "ADMIN")   return NextResponse.redirect(new URL("/admin", request.url));
      if (user.role === "CREATOR") return NextResponse.redirect(new URL("/creator/dashboard", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Creator portal — must be CREATOR role
  if (CREATOR_ROUTES.some(r => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.role !== "CREATOR") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Admin portal — must be ADMIN role
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.role !== "ADMIN") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Legacy /upload — redirect creators to portal
  if (pathname === "/upload") {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.role === "CREATOR") return NextResponse.redirect(new URL("/creator/upload", request.url));
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
