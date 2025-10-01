import { NextRequest, NextResponse } from 'next/server'
import { createConversionsAPI } from '@/lib/meta/conversions'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

// POST /api/social/conversions - Track conversion events
export async function POST(request: NextRequest) {
  try {
    // Mock Meta configuration check - in real implementation, this would be in config
    const metaEnabled = process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN;
    if (!metaEnabled) {
      return NextResponse.json(
        { error: 'Conversions API not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      eventName,
      userData,
      customData,
      eventSourceUrl
    } = body

    // Validate required fields
    if (!eventName) {
      return NextResponse.json(
        { error: 'eventName is required' },
        { status: 400 }
      )
    }

    if (!userData || !userData.ipAddress || !userData.userAgent) {
      return NextResponse.json(
        { error: 'userData with ipAddress and userAgent is required' },
        { status: 400 }
      )
    }

    // Create Conversions API instance
    const conversionsAPI = createConversionsAPI(
      process.env.META_ACCESS_TOKEN!,
      process.env.META_PIXEL_ID!
    )

    // Create conversion event
    const event = conversionsAPI.createEvent(
      eventName,
      userData,
      customData,
      eventSourceUrl
    )

    // Send event
    const result = await conversionsAPI.sendEvent(event)

    logger.info('Conversion event tracked', {
      eventName,
      eventId: event.event_id,
      eventsReceived: result.events_received
    })

    return NextResponse.json({
      success: true,
      eventId: event.event_id,
      eventsReceived: result.events_received
    })

  } catch (error) {
    logger.error('Conversion tracking failed:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to track conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/social/conversions/batch - Track multiple conversion events
export async function PUT(request: NextRequest) {
  try {
    // Mock Meta configuration check - in real implementation, this would be in config
    const metaEnabled = process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN;
    if (!metaEnabled) {
      return NextResponse.json(
        { error: 'Conversions API not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { events } = body

    // Validate required fields
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      )
    }

    // Create Conversions API instance
    const conversionsAPI = createConversionsAPI(
      process.env.META_ACCESS_TOKEN!,
      process.env.META_PIXEL_ID!
    )

    // Create conversion events
    const conversionEvents = events.map((eventData: any) => {
      const { eventName, userData, customData, eventSourceUrl } = eventData
      
      if (!eventName || !userData || !userData.ipAddress || !userData.userAgent) {
        throw new Error('Invalid event data')
      }

      return conversionsAPI.createEvent(
        eventName,
        userData,
        customData,
        eventSourceUrl
      )
    })

    // Send batch events
    const result = await conversionsAPI.sendBatchEvents(conversionEvents)

    logger.info('Batch conversion events tracked', {
      eventCount: events.length,
      eventsReceived: result.events_received
    })

    return NextResponse.json({
      success: true,
      eventsReceived: result.events_received,
      eventCount: events.length
    })

  } catch (error) {
    logger.error('Batch conversion tracking failed:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to track batch conversions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Convenience endpoints for common events

// POST /api/social/conversions/pageview - Track page view
export async function PATCH(request: NextRequest) {
  try {
    // Mock Meta configuration check - in real implementation, this would be in config
    const metaEnabled = process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN;
    if (!metaEnabled) {
      return NextResponse.json(
        { error: 'Conversions API not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      userData,
      pageUrl,
      pageTitle
    } = body

    // Validate required fields
    if (!userData || !userData.ipAddress || !userData.userAgent) {
      return NextResponse.json(
        { error: 'userData with ipAddress and userAgent is required' },
        { status: 400 }
      )
    }

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400 }
      )
    }

    // Create Conversions API instance
    const conversionsAPI = createConversionsAPI(
      process.env.META_ACCESS_TOKEN!,
      process.env.META_PIXEL_ID!
    )

    // Track page view
    const result = await conversionsAPI.trackPageView(
      userData,
      pageUrl,
      pageTitle
    )

    logger.info('Page view tracked', {
      pageUrl,
      pageTitle,
      eventsReceived: result.events_received
    })

    return NextResponse.json({
      success: true,
      eventsReceived: result.events_received
    })

  } catch (error) {
    logger.error('Page view tracking failed:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to track page view',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


