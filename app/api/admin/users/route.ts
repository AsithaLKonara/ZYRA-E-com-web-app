import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getUserStats } from '@/lib/auth-utils'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { rateLimiter } from '@/lib/rate-limiter'
import { db } from '@/lib/db-connection'

// Get all users (admin only)
async function getUsersHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiter.middleware(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!await isAdmin()) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.isActive = status === 'active'
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get users' },
      { status: 500 }
    )
  }
}

// Get user statistics (admin only)
async function getUserStatsHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!await isAdmin()) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const stats = await getUserStats()

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      stats,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get user statistics' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(getUsersHandler))
export const POST = withApiVersioning(withErrorHandler(getUserStatsHandler))




