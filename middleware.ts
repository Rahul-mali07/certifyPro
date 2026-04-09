import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  console.log("[v0] Middleware:", pathname, "Token:", token ? "present" : "missing")

  // Public routes - always accessible
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/organization/login") ||
    pathname.startsWith("/organization/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/api/certificates") ||
    pathname.startsWith("/api/organization") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check auth for protected routes
  if (!token) {
    console.log("[v0] Middleware: No token, redirecting to /login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string
    console.log("[v0] Middleware: Token valid, role:", role)

    // Admin routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      console.log("[v0] Middleware: Non-admin accessing /admin, redirect to /dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // User routes
    if (pathname.startsWith("/dashboard") && role === "admin") {
      console.log("[v0] Middleware: Admin accessing /dashboard, redirect to /admin")
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    console.log("[v0] Middleware: Access granted to", pathname)
    return NextResponse.next()
  } catch (error) {
    console.log("[v0] Middleware: Token verification failed:", error)
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" })
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
}
