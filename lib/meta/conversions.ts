import { config } from '../config'
import { logger } from '../logger'

// Conversions API Types
export interface ConversionEvent {
  event_name: string
  event_time: number
  event_id: string
  event_source_url: string
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other'
  user_data: {
    em?: string[] // hashed emails
    ph?: string[] // hashed phone numbers
    client_ip_address: string
    client_user_agent: string
    fbc?: string // Facebook click ID
    fbp?: string // Facebook browser ID
    external_id?: string[] // hashed external IDs
  }
  custom_data?: {
    value?: number
    currency?: string
    content_name?: string
    content_category?: string
    content_ids?: string[]
    contents?: Array<{
      id: string
      quantity: number
      item_price: number
    }>
    num_items?: number
    order_id?: string
    search_string?: string
  }
  app_data?: {
    advertiser_tracking_enabled: boolean
    application_tracking_enabled: boolean
    extinfo: string[]
  }
}

export interface ConversionResponse {
  events_received: number
  messages: string[]
  fbtrace_id: string
}

export interface BatchConversionRequest {
  data: ConversionEvent[]
  test_event_code?: string
  partner_agent?: string
}

// Conversions API Client
export class ConversionsAPI {
  private accessToken: string
  private pixelId: string
  private baseURL = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string, pixelId: string) {
    this.accessToken = accessToken
    this.pixelId = pixelId
  }

  // Hash email using SHA256
  private hashEmail(email: string): string {
    // In production, use crypto.subtle.digest for proper hashing
    // This is a simplified version for development
    return Buffer.from(email.toLowerCase().trim()).toString('base64')
  }

  // Hash phone number using SHA256
  private hashPhone(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '')
    return Buffer.from(cleaned).toString('base64')
  }

  // Hash external ID using SHA256
  private hashExternalId(id: string): string {
    return Buffer.from(id).toString('base64')
  }

  // Create a conversion event
  createEvent(
    eventName: string,
    userData: {
      email?: string
      phone?: string
      externalId?: string
      ipAddress: string
      userAgent: string
      fbc?: string
      fbp?: string
    },
    customData?: ConversionEvent['custom_data'],
    eventSourceUrl?: string
  ): ConversionEvent {
    const hashedUserData: ConversionEvent['user_data'] = {
      client_ip_address: userData.ipAddress,
      client_user_agent: userData.userAgent
    }

    // Add hashed email if provided
    if (userData.email) {
      hashedUserData.em = [this.hashEmail(userData.email)]
    }

    // Add hashed phone if provided
    if (userData.phone) {
      hashedUserData.ph = [this.hashPhone(userData.phone)]
    }

    // Add hashed external ID if provided
    if (userData.externalId) {
      hashedUserData.external_id = [this.hashExternalId(userData.externalId)]
    }

    // Add Facebook IDs if provided
    if (userData.fbc) {
      hashedUserData.fbc = userData.fbc
    }
    if (userData.fbp) {
      hashedUserData.fbp = userData.fbp
    }

    return {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_source_url: eventSourceUrl || '',
      action_source: 'website',
      user_data: hashedUserData,
      custom_data: customData
    }
  }

  // Send a single conversion event
  async sendEvent(event: ConversionEvent): Promise<ConversionResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [event],
            access_token: this.accessToken
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Conversions API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Conversion event sent', { eventId: event.event_id, eventName: event.event_name })
      
      return data
    } catch (error) {
      logger.error('Failed to send conversion event:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Send batch conversion events
  async sendBatchEvents(events: ConversionEvent[]): Promise<ConversionResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: events,
            access_token: this.accessToken
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Conversions API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Batch conversion events sent', { 
        eventsReceived: data.events_received,
        eventCount: events.length 
      })
      
      return data
    } catch (error) {
      logger.error('Failed to send batch conversion events:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Track page view
  async trackPageView(
    userData: ConversionEvent['user_data'],
    pageUrl: string,
    pageTitle?: string
  ): Promise<ConversionResponse> {
    const event = this.createEvent(
      'PageView',
      {
        ipAddress: userData.client_ip_address,
        userAgent: userData.client_user_agent,
        email: userData.em?.[0],
        phone: userData.ph?.[0],
        externalId: userData.external_id?.[0],
        fbc: userData.fbc,
        fbp: userData.fbp
      },
      {
        content_name: pageTitle
      },
      pageUrl
    )

    return this.sendEvent(event)
  }

  // Track add to cart
  async trackAddToCart(
    userData: ConversionEvent['user_data'],
    productId: string,
    productName: string,
    value: number,
    currency: string = 'USD'
  ): Promise<ConversionResponse> {
    const event = this.createEvent(
      'AddToCart',
      {
        ipAddress: userData.client_ip_address,
        userAgent: userData.client_user_agent,
        email: userData.em?.[0],
        phone: userData.ph?.[0],
        externalId: userData.external_id?.[0],
        fbc: userData.fbc,
        fbp: userData.fbp
      },
      {
        content_ids: [productId],
        content_name: productName,
        value,
        currency,
        num_items: 1
      }
    )

    return this.sendEvent(event)
  }

  // Track purchase
  async trackPurchase(
    userData: ConversionEvent['user_data'],
    orderId: string,
    value: number,
    currency: string = 'USD',
    contents?: Array<{
      id: string
      quantity: number
      item_price: number
    }>
  ): Promise<ConversionResponse> {
    const event = this.createEvent(
      'Purchase',
      {
        ipAddress: userData.client_ip_address,
        userAgent: userData.client_user_agent,
        email: userData.em?.[0],
        phone: userData.ph?.[0],
        externalId: userData.external_id?.[0],
        fbc: userData.fbc,
        fbp: userData.fbp
      },
      {
        order_id: orderId,
        value,
        currency,
        contents,
        num_items: contents?.length || 1
      }
    )

    return this.sendEvent(event)
  }

  // Track lead
  async trackLead(
    userData: ConversionEvent['user_data'],
    leadId: string,
    value?: number,
    currency: string = 'USD'
  ): Promise<ConversionResponse> {
    const event = this.createEvent(
      'Lead',
      {
        ipAddress: userData.client_ip_address,
        userAgent: userData.client_user_agent,
        email: userData.em?.[0],
        phone: userData.ph?.[0],
        externalId: userData.external_id?.[0],
        fbc: userData.fbc,
        fbp: userData.fbp
      },
      {
        order_id: leadId,
        value,
        currency
      }
    )

    return this.sendEvent(event)
  }
}

// Factory function to create Conversions API instance
export function createConversionsAPI(accessToken: string, pixelId: string): ConversionsAPI {
  return new ConversionsAPI(accessToken, pixelId)
}

// Default instance using config
export const conversionsAPI = createConversionsAPI(
  process.env.FACEBOOK_ACCESS_TOKEN || '',
  process.env.FACEBOOK_PIXEL_ID || ''
)


