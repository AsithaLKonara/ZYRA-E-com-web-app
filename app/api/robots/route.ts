import { NextRequest, NextResponse } from 'next/server'
import { generateRobotsTxt } from '@/lib/seo'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const robotsTxt = generateRobotsTxt()

    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    logger.error('Robots.txt generation failed', {}, error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: 'Failed to generate robots.txt' },
      { status: 500 }
    )
  }
}




