import { config } from '../config'
import { logger } from '../logger'

// Instagram Content Publishing API Types
export interface InstagramMedia {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  thumbnail_url?: string
  caption?: string
  timestamp: string
}

export interface InstagramContainer {
  id: string
  status: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'
  status_code: string
}

export interface InstagramPublishRequest {
  image_url?: string
  video_url?: string
  caption?: string
  user_tags?: Array<{
    username: string
    x: number
    y: number
  }>
  location_id?: string
  product_tags?: Array<{
    product_id: string
    x: number
    y: number
  }>
}

export interface InstagramPublishResponse {
  id: string
  status: string
}

// Instagram Content Publishing API Client
export class InstagramAPI {
  private accessToken: string
  private baseURL = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Create a media container for publishing
  async createMediaContainer(request: InstagramPublishRequest): Promise<InstagramContainer> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        ...(request.image_url && { image_url: request.image_url }),
        ...(request.video_url && { video_url: request.video_url }),
        ...(request.caption && { caption: request.caption }),
        ...(request.location_id && { location_id: request.location_id }),
        ...(request.user_tags && { user_tags: JSON.stringify(request.user_tags) }),
        ...(request.product_tags && { product_tags: JSON.stringify(request.product_tags) })
      })

      const response = await fetch(`${this.baseURL}/me/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Instagram media container created', { containerId: data.id })
      
      return data
    } catch (error) {
      logger.error('Failed to create Instagram media container:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Check container status
  async getContainerStatus(containerId: string): Promise<InstagramContainer> {
    try {
      const response = await fetch(
        `${this.baseURL}/${containerId}?fields=status_code&access_token=${this.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get Instagram container status:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Publish the container
  async publishContainer(containerId: string): Promise<InstagramPublishResponse> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        creation_id: containerId
      })

      const response = await fetch(`${this.baseURL}/me/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Instagram media published', { mediaId: data.id })
      
      return data
    } catch (error) {
      logger.error('Failed to publish Instagram container:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Get media details
  async getMedia(mediaId: string): Promise<InstagramMedia> {
    try {
      const response = await fetch(
        `${this.baseURL}/${mediaId}?fields=id,media_type,media_url,permalink,thumbnail_url,caption,timestamp&access_token=${this.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Instagram API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get Instagram media:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Poll container status until ready
  async waitForContainerReady(containerId: string, maxAttempts = 30, delayMs = 2000): Promise<InstagramContainer> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const container = await this.getContainerStatus(containerId)
      
      if (container.status === 'FINISHED') {
        return container
      }
      
      if (container.status === 'ERROR') {
        throw new Error(`Container processing failed: ${container.status_code}`)
      }
      
      if (container.status === 'EXPIRED') {
        throw new Error('Container expired before processing completed')
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    
    throw new Error('Container processing timeout')
  }

  // Complete publish flow
  async publishMedia(request: InstagramPublishRequest): Promise<InstagramMedia> {
    try {
      logger.info('Starting Instagram publish flow', { request })
      
      // Step 1: Create container
      const container = await this.createMediaContainer(request)
      
      // Step 2: Wait for container to be ready
      await this.waitForContainerReady(container.id)
      
      // Step 3: Publish container
      const publishResult = await this.publishContainer(container.id)
      
      // Step 4: Get published media details
      const media = await this.getMedia(publishResult.id)
      
      logger.info('Instagram publish completed successfully', { mediaId: media.id })
      return media
      
    } catch (error) {
      logger.error('Instagram publish failed:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Factory function to create Instagram API instance
export function createInstagramAPI(accessToken: string): InstagramAPI {
  return new InstagramAPI(accessToken)
}

// Default instance using config
export const instagramAPI = createInstagramAPI(process.env.INSTAGRAM_ACCESS_TOKEN || '')


