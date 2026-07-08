import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isUserPage = request.nextUrl.pathname.startsWith("/(user)");

  // Redirect to login if trying to access protected routes
  if (!token) {
    if (isDashboard || isAdminPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect to home if already logged in and accessing auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // RBAC Check for Dashboard
  if (isDashboard && token?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // RBAC Check for Admin
  if (isAdminPage && !["ADMIN", "OWNER"].includes(token?.role as string)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/(user)/:path*",
  ],
};
