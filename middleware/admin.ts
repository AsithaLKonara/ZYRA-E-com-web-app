import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function adminMiddleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Check if user has admin role
  if (token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ]
}



