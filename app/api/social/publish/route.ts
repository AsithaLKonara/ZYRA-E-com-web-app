import { NextRequest, NextResponse } from 'next/server'
import { createInstagramAPI } from '@/lib/meta/ig'
import { createFacebookAdsAPI } from '@/lib/meta/ads'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

// POST /api/social/publish - Publish content to Instagram
export async function POST(request: NextRequest) {
  try {
    // Mock Meta configuration check - in real implementation, this would be in config
    const metaEnabled = process.env.META_ACCESS_TOKEN;
    if (!metaEnabled) {
      return NextResponse.json(
        { error: 'Meta API not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      imageUrl, 
      videoUrl, 
      caption, 
      productId,
      boost = false,
      boostBudget,
      boostDuration,
      targeting
    } = body

    // Validate required fields
    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { error: 'Either imageUrl or videoUrl is required' },
        { status: 400 }
      )
    }

    if (!caption) {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      )
    }

    // Create Instagram API instance
    const instagramAPI = createInstagramAPI(process.env.META_ACCESS_TOKEN!)

    // Prepare publish request
    const publishRequest = {
      image_url: imageUrl,
      video_url: videoUrl,
      caption: caption,
      product_tags: productId ? [{
        product_id: productId,
        x: 0.5, // Center of image
        y: 0.5
      }] : undefined
    }

    // Publish to Instagram
    const publishedMedia = await instagramAPI.publishMedia(publishRequest)

    let boostResult = null

    // If boost is requested, create Facebook ad
    if (boost && boostBudget && boostDuration) {
      try {
        const facebookAdsAPI = createFacebookAdsAPI(
          process.env.META_ACCESS_TOKEN!,
          process.env.META_AD_ACCOUNT_ID!
        )

        boostResult = await facebookAdsAPI.boostPost(
          publishedMedia.id,
          boostBudget,
          boostDuration,
          targeting || {
            geo_locations: {
              countries: ['US']
            },
            age_min: 18,
            age_max: 65,
            genders: [1, 2] // All genders
          }
        )

        logger.info('Content boosted successfully', {
          mediaId: publishedMedia.id,
          campaignId: boostResult.campaign.id,
          adId: boostResult.ad.id
        })
      } catch (boostError) {
        logger.error('Boost failed, but content was published:', { error: boostError instanceof Error ? boostError.message : String(boostError) })
        // Don't fail the entire request if boost fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      media: {
        id: publishedMedia.id,
        type: publishedMedia.media_type,
        url: publishedMedia.media_url,
        permalink: publishedMedia.permalink,
        caption: publishedMedia.caption
      },
      boost: boostResult ? {
        campaignId: boostResult.campaign.id,
        adSetId: boostResult.adSet.id,
        adId: boostResult.ad.id
      } : null
    })

  } catch (error) {
    logger.error('Social publish failed:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to publish content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/social/publish - Get publishing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { error: 'mediaId is required' },
        { status: 400 }
      )
    }

    // Mock Meta configuration check - in real implementation, this would be in config
    const metaEnabled = process.env.META_ACCESS_TOKEN;
    if (!metaEnabled) {
      return NextResponse.json(
        { error: 'Meta API not configured' },
        { status: 400 }
      )
    }

    const instagramAPI = createInstagramAPI(process.env.META_ACCESS_TOKEN!)
    const media = await instagramAPI.getMedia(mediaId)

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        type: media.media_type,
        url: media.media_url,
        permalink: media.permalink,
        caption: media.caption,
        timestamp: media.timestamp
      }
    })

  } catch (error) {
    logger.error('Failed to get media status:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get media status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


