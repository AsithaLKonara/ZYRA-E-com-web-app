export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getUserById, activateUser, deactivateUser } from '@/lib/auth-utils'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { rateLimiter } from '@/lib/rate-limiter'
import { db } from '@/lib/db-connection'

// Get user by ID (admin only)
async function getUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const targetUser = await getUserById(params.id)

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: targetUser,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

// Update user (admin only)
async function updateUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, email, role, isActive } = await request.json()

    // Validate input
    if (email && typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email must be a string' },
        { status: 400 }
      )
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name must be a string' },
        { status: 400 }
      )
    }

    if (role && !['ADMIN', 'CUSTOMER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await getUserById(params.id)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already taken
    if (email && email !== targetUser.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already taken' },
          { status: 409 }
        )
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
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
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Delete user (admin only)
async function deleteUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user exists
    const targetUser = await getUserById(params.id)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (user.id === params.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (this will cascade delete related records)
    await db.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// Activate/Deactivate user (admin only)
async function toggleUserStatusHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { action } = await request.json()

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be activate or deactivate' },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await getUserById(params.id)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deactivation
    if (user.id === params.id && action === 'deactivate') {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Toggle user status
    const success = action === 'activate' 
      ? await activateUser(params.id)
      : await deactivateUser(params.id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to ${action} user` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to toggle user status' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(getUserHandler))
export const PUT = withApiVersioning(withErrorHandler(updateUserHandler))
export const DELETE = withApiVersioning(withErrorHandler(deleteUserHandler))
export const PATCH = withApiVersioning(withErrorHandler(toggleUserStatusHandler))




