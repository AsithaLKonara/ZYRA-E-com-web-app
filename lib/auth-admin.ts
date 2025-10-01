import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return {
      error: "Unauthorized",
      status: 401
    }
  }

  if (session.user.role !== "admin") {
    return {
      error: "Forbidden - Admin access required",
      status: 403
    }
  }

  return {
    user: session.user,
    status: 200
  }
}

export function isAdmin(user: any): boolean {
  return user?.role === "admin"
}

export function requireAdminClient() {
  // This would be used in client components
  // The actual role checking should be done server-side
  return true
}



