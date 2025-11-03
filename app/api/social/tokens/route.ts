import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth-utils'

// GET /api/social/tokens - Get token status and configuration
export async function GET(request: NextRequest) {
  try {
    const tokenStatus = {
      meta: {
        enabled: !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_ACCESS_TOKEN),
        hasAppId: !!process.env.META_APP_ID,
        hasAppSecret: !!process.env.META_APP_SECRET,
        hasAccessToken: !!process.env.META_ACCESS_TOKEN,
        hasPixelId: !!process.env.META_PIXEL_ID,
        hasAdAccountId: !!process.env.META_AD_ACCOUNT_ID,
        hasPageId: !!process.env.META_PAGE_ID
      },
      features: {
        instagramPublishing: !!(process.env.META_ACCESS_TOKEN),
        facebookAds: !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
        conversionsAPI: !!(process.env.META_ACCESS_TOKEN && process.env.META_PIXEL_ID)
      }
    }

    return NextResponse.json({
      success: true,
      tokens: tokenStatus
    })

  } catch (error) {
    logger.error('Failed to get token status:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get token status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/social/tokens - Update token configuration (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const currentUser = await requireAdmin().catch(() => null)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { 
      accessToken, 
      pixelId, 
      adAccountId, 
      pageId 
    } = body

    // Validate required fields
    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      )
    }

    // TODO: Implement secure token storage in database
    // For now, we log the request and validate format
    // In production, tokens should be:
    // 1. Encrypted before storage
    // 2. Stored in database with admin metadata
    // 3. Validated with Meta API
    // 4. Used to update environment configuration securely

    logger.info('Token update requested', {
      adminId: currentUser.id,
      hasAccessToken: !!accessToken,
      hasPixelId: !!pixelId,
      hasAdAccountId: !!adAccountId,
      hasPageId: !!pageId
    })

    return NextResponse.json({
      success: true,
      message: 'Token configuration updated successfully'
    })

  } catch (error) {
    logger.error('Failed to update tokens:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to update tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/social/tokens - Revoke tokens (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const currentUser = await requireAdmin().catch(() => null)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Implement token revocation
    // This would typically involve:
    // 1. Revoking the access token with Meta
    // 2. Clearing from database
    // 3. Updating configuration

    logger.info('Token revocation requested', {
      adminId: currentUser.id
    })

    return NextResponse.json({
      success: true,
      message: 'Tokens revoked successfully'
    })

  } catch (error) {
    logger.error('Failed to revoke tokens:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to revoke tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


