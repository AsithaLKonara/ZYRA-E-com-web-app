import { logger } from './logger'

// CDN configuration
const cdnConfig = {
  provider: process.env.CDN_PROVIDER || 'cloudflare',
  baseUrl: process.env.CDN_URL || 'https://cdn.zyra-ultra.com',
  apiKey: process.env.CDN_API_KEY,
  zoneId: process.env.CDN_ZONE_ID,
  cacheTTL: parseInt(process.env.CDN_CACHE_TTL || '31536000'), // 1 year
  compression: process.env.CDN_COMPRESSION === 'true',
  webp: process.env.CDN_WEBP === 'true',
  avif: process.env.CDN_AVIF === 'true',
}

// CDN interface
interface CDNOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  blur?: number
  sharpen?: number
  brightness?: number
  contrast?: number
  saturation?: number
  hue?: number
}

// CDN class
export class CDN {
  private provider: string
  private baseUrl: string
  private apiKey?: string
  private zoneId?: string

  constructor() {
    this.provider = cdnConfig.provider
    this.baseUrl = cdnConfig.baseUrl
    this.apiKey = cdnConfig.apiKey
    this.zoneId = cdnConfig.zoneId
  }

  // Generate CDN URL
  generateUrl(originalUrl: string, options: CDNOptions = {}): string {
    try {
      const url = new URL(originalUrl, this.baseUrl)
      
      // Add transformation parameters
      if (options.width) url.searchParams.set('w', options.width.toString())
      if (options.height) url.searchParams.set('h', options.height.toString())
      if (options.quality) url.searchParams.set('q', options.quality.toString())
      if (options.format) url.searchParams.set('f', options.format)
      if (options.fit) url.searchParams.set('fit', options.fit)
      if (options.gravity) url.searchParams.set('g', options.gravity)
      if (options.blur) url.searchParams.set('blur', options.blur.toString())
      if (options.sharpen) url.searchParams.set('sharpen', options.sharpen.toString())
      if (options.brightness) url.searchParams.set('brightness', options.brightness.toString())
      if (options.contrast) url.searchParams.set('contrast', options.contrast.toString())
      if (options.saturation) url.searchParams.set('saturation', options.saturation.toString())
      if (options.hue) url.searchParams.set('hue', options.hue.toString())
      
      return url.toString()
    } catch (error) {
      logger.error('CDN URL generation failed:', {}, error instanceof Error ? error : new Error(String(error)))
      return originalUrl
    }
  }

  // Generate responsive image URLs
  generateResponsiveUrls(originalUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]): string[] {
    return sizes.map(size => this.generateUrl(originalUrl, { width: size }))
  }

  // Generate WebP URL
  generateWebPUrl(originalUrl: string, options: CDNOptions = {}): string {
    return this.generateUrl(originalUrl, { ...options, format: 'webp' })
  }

  // Generate AVIF URL
  generateAVIFUrl(originalUrl: string, options: CDNOptions = {}): string {
    return this.generateUrl(originalUrl, { ...options, format: 'avif' })
  }

  // Purge cache
  async purgeCache(urls: string[]): Promise<boolean> {
    try {
      if (this.provider === 'cloudflare' && this.apiKey && this.zoneId) {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              files: urls.map(url => this.baseUrl + url),
            }),
          }
        )

        const result = await response.json()
        return result.success
      } else if (this.provider === 'aws' && this.apiKey) {
        // AWS CloudFront implementation
        const AWS = require('aws-sdk')
        const cloudfront = new AWS.CloudFront({
          accessKeyId: this.apiKey,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        })

        const params = {
          DistributionId: this.zoneId,
          Paths: {
            Quantity: urls.length,
            Items: urls.map(url => this.baseUrl + url),
          },
        }

        await cloudfront.createInvalidation(params).promise()
        return true
      }

      logger.warn('CDN purge not configured for provider', { provider: this.provider })
      return false
    } catch (error) {
      logger.error('CDN cache purge failed:', {}, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  // Upload file to CDN
  async uploadFile(file: Buffer, filename: string, contentType: string): Promise<string | null> {
    try {
      if (this.provider === 'cloudflare' && this.apiKey && this.zoneId) {
        const formData = new FormData()
        formData.append('file', new Blob([new Uint8Array(file)], { type: contentType }), filename)

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.zoneId}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: formData,
          }
        )

        const result = await response.json()
        return result.result?.variants?.[0] || null
      } else if (this.provider === 'aws' && this.apiKey) {
        // AWS S3 implementation
        const AWS = require('aws-sdk')
        const s3 = new AWS.S3({
          accessKeyId: this.apiKey,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        })

        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: file,
          ContentType: contentType,
          ACL: 'public-read',
        }

        const result = await s3.upload(params).promise()
        return result.Location
      }

      logger.warn('CDN upload not configured for provider', { provider: this.provider })
      return null
    } catch (error) {
      logger.error('CDN file upload failed:', {}, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  // Get CDN statistics
  async getStats(): Promise<{
    bandwidth: number
    requests: number
    cacheHitRate: number
    errors: number
  } | null> {
    try {
      if (this.provider === 'cloudflare' && this.apiKey && this.zoneId) {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/analytics/dashboard`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        )

        const result = await response.json()
        const data = result.result?.totals

        return {
          bandwidth: data?.bandwidth || 0,
          requests: data?.requests || 0,
          cacheHitRate: data?.cache_hit_rate || 0,
          errors: data?.errors || 0,
        }
      }

      return null
    } catch (error) {
      logger.error('CDN stats retrieval failed:', {}, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }
}

// CDN utilities
export const cdnUtils = {
  // Generate image optimization URL
  optimizeImage: (url: string, options: CDNOptions = {}) => {
    const cdn = new CDN()
    return cdn.generateUrl(url, options)
  },

  // Generate responsive image set
  generateResponsiveImageSet: (url: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]) => {
    const cdn = new CDN()
    return cdn.generateResponsiveUrls(url, sizes)
  },

  // Generate modern format URLs
  generateModernFormats: (url: string, options: CDNOptions = {}) => {
    const cdn = new CDN()
    return {
      original: url,
      webp: cdn.generateWebPUrl(url, options),
      avif: cdn.generateAVIFUrl(url, options),
    }
  },

  // Check if URL is from CDN
  isCDNUrl: (url: string): boolean => {
    return url.startsWith(cdnConfig.baseUrl)
  },

  // Extract original URL from CDN URL
  extractOriginalUrl: (cdnUrl: string): string => {
    try {
      const url = new URL(cdnUrl)
      // Remove CDN-specific parameters
      const paramsToRemove = ['w', 'h', 'q', 'f', 'fit', 'g', 'blur', 'sharpen', 'brightness', 'contrast', 'saturation', 'hue']
      paramsToRemove.forEach(param => url.searchParams.delete(param))
      return url.toString()
    } catch (error) {
      return cdnUrl
    }
  },

  // Generate lazy loading attributes
  generateLazyAttributes: (url: string, options: CDNOptions = {}) => {
    const cdn = new CDN()
    const placeholder = cdn.generateUrl(url, { ...options, width: 20, height: 20, blur: 10 })
    const fullImage = cdn.generateUrl(url, options)
    
    return {
      src: placeholder,
      'data-src': fullImage,
      'data-srcset': cdn.generateResponsiveUrls(url).join(', '),
      loading: 'lazy',
      decoding: 'async',
    }
  },
}

// Export default CDN instance
export const cdn = new CDN()


