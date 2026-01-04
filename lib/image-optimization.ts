import sharp from 'sharp'
import { logger } from './logger'

// Image optimization configuration
const IMAGE_CONFIG = {
  // Quality settings
  QUALITY: {
    HIGH: 90,
    MEDIUM: 80,
    LOW: 70,
    THUMBNAIL: 60,
  },
  
  // Size presets
  SIZES: {
    THUMBNAIL: { width: 150, height: 150 },
    SMALL: { width: 300, height: 300 },
    MEDIUM: { width: 600, height: 600 },
    LARGE: { width: 1200, height: 1200 },
    XLARGE: { width: 1920, height: 1920 },
  },
  
  // Format settings
  FORMATS: {
    WEBP: { quality: 80, effort: 4 },
    JPEG: { quality: 80, progressive: true },
    PNG: { quality: 80, compressionLevel: 9 },
    AVIF: { quality: 80, effort: 4 },
  },
  
  // Processing options
  OPTIONS: {
    STRIP_METADATA: true,
    PROGRESSIVE: true,
    MOZJPEG: true,
  },
} as const

// Image optimization result interface
export interface ImageOptimizationResult {
  success: boolean
  data?: Buffer
  format?: string
  width?: number
  height?: number
  size?: number
  error?: string
}

// Image metadata interface
export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  channels: number
  density?: number
  hasAlpha: boolean
  isAnimated: boolean
}

// Image optimization service class
export class ImageOptimizationService {
  // Optimize image with specified options
  async optimizeImage(
    input: Buffer | string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png' | 'avif'
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
      position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
      background?: string
      blur?: boolean
      blurRadius?: number
      grayscale?: boolean
      normalize?: boolean
      gamma?: number
      brightness?: number
      contrast?: number
      saturation?: number
      hue?: number
    } = {}
  ): Promise<ImageOptimizationResult> {
    try {
      const {
        width,
        height,
        quality = IMAGE_CONFIG.QUALITY.MEDIUM,
        format = 'webp',
        fit = 'cover',
        position = 'center',
        background = '#ffffff',
        blur = false,
        blurRadius = 1,
        grayscale = false,
        normalize = false,
        gamma = 1,
        brightness = 1,
        contrast = 1,
        saturation = 1,
        hue = 0,
      } = options

      let pipeline = sharp(input)

      // Apply metadata stripping
      if (IMAGE_CONFIG.OPTIONS.STRIP_METADATA) {
        pipeline = pipeline.withMetadata({})
      }

      // Apply resize
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit,
          position,
          background,
        })
      }

      // Apply blur
      if (blur) {
        pipeline = pipeline.blur(blurRadius)
      }

      // Apply color adjustments
      if (grayscale) {
        pipeline = pipeline.grayscale()
      }

      if (normalize) {
        pipeline = pipeline.normalize()
      }

      if (gamma !== 1) {
        pipeline = pipeline.gamma(gamma)
      }

      if (brightness !== 1 || saturation !== 1 || hue !== 0) {
        pipeline = pipeline.modulate({
          brightness,
          saturation,
          hue,
        })
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({
            quality,
            effort: IMAGE_CONFIG.FORMATS.WEBP.effort,
          })
          break

        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality,
            progressive: IMAGE_CONFIG.FORMATS.JPEG.progressive,
            mozjpeg: IMAGE_CONFIG.OPTIONS.MOZJPEG,
          })
          break

        case 'png':
          pipeline = pipeline.png({
            quality,
            compressionLevel: IMAGE_CONFIG.FORMATS.PNG.compressionLevel,
          })
          break

        case 'avif':
          pipeline = pipeline.avif({
            quality,
            effort: IMAGE_CONFIG.FORMATS.AVIF.effort,
          })
          break

        default:
          throw new Error(`Unsupported format: ${format}`)
      }

      // Process image
      const data = await pipeline.toBuffer()
      const metadata = await sharp(data).metadata()

      logger.info('Image optimized successfully', {
        format,
        width: metadata.width,
        height: metadata.height,
        size: data.length,
        quality,
      })

      return {
        success: true,
        data,
        format,
        width: metadata.width,
        height: metadata.height,
        size: data.length,
      }

    } catch (error) {
      logger.error('Image optimization error:', {}, error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed',
      }
    }
  }

  // Generate multiple sizes of an image
  async generateSizes(
    input: Buffer | string,
    sizes: Array<{
      name: string
      width: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png' | 'avif'
    }>
  ): Promise<Record<string, ImageOptimizationResult>> {
    const results: Record<string, ImageOptimizationResult> = {}

    await Promise.all(
      sizes.map(async (size) => {
        const result = await this.optimizeImage(input, {
          width: size.width,
          height: size.height,
          quality: size.quality,
          format: size.format,
        })
        results[size.name] = result
      })
    )

    return results
  }

  // Generate responsive image sizes
  async generateResponsiveSizes(
    input: Buffer | string,
    baseName: string
  ): Promise<Record<string, ImageOptimizationResult>> {
    const sizes = [
      { name: `${baseName}-thumbnail`, ...IMAGE_CONFIG.SIZES.THUMBNAIL, quality: IMAGE_CONFIG.QUALITY.THUMBNAIL },
      { name: `${baseName}-small`, ...IMAGE_CONFIG.SIZES.SMALL, quality: IMAGE_CONFIG.QUALITY.MEDIUM },
      { name: `${baseName}-medium`, ...IMAGE_CONFIG.SIZES.MEDIUM, quality: IMAGE_CONFIG.QUALITY.MEDIUM },
      { name: `${baseName}-large`, ...IMAGE_CONFIG.SIZES.LARGE, quality: IMAGE_CONFIG.QUALITY.HIGH },
      { name: `${baseName}-xlarge`, ...IMAGE_CONFIG.SIZES.XLARGE, quality: IMAGE_CONFIG.QUALITY.HIGH },
    ]

    return this.generateSizes(input, sizes)
  }

  // Create thumbnail
  async createThumbnail(
    input: Buffer | string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    } = {}
  ): Promise<ImageOptimizationResult> {
    const {
      width = IMAGE_CONFIG.SIZES.THUMBNAIL.width,
      height = IMAGE_CONFIG.SIZES.THUMBNAIL.height,
      quality = IMAGE_CONFIG.QUALITY.THUMBNAIL,
      format = 'webp',
    } = options

    return this.optimizeImage(input, {
      width,
      height,
      quality,
      format,
      fit: 'cover',
    })
  }

  // Get image metadata
  async getMetadata(input: Buffer | string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(input).metadata()

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        channels: metadata.channels || 0,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha || false,
        isAnimated: metadata.pages ? metadata.pages > 1 : false,
      }
    } catch (error) {
      logger.error('Error getting image metadata:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Convert image format
  async convertFormat(
    input: Buffer | string,
    targetFormat: 'webp' | 'jpeg' | 'png' | 'avif',
    quality?: number
  ): Promise<ImageOptimizationResult> {
    return this.optimizeImage(input, {
      format: targetFormat,
      quality,
    })
  }

  // Apply filters
  async applyFilters(
    input: Buffer | string,
    filters: {
      blur?: number
      grayscale?: boolean
      sepia?: boolean
      brightness?: number
      contrast?: number
      saturation?: number
      hue?: number
      gamma?: number
      normalize?: boolean
    }
  ): Promise<ImageOptimizationResult> {
    const {
      blur,
      grayscale,
      sepia,
      brightness,
      contrast,
      saturation,
      hue,
      gamma,
      normalize,
    } = filters

    let pipeline = sharp(input)

    if (blur) {
      pipeline = pipeline.blur(blur)
    }

    if (grayscale) {
      pipeline = pipeline.grayscale()
    }

    if (sepia) {
      pipeline = pipeline.modulate({
        brightness: 1.1,
        saturation: 0.8,
        hue: 35,
      })
    }

    if (brightness !== undefined || saturation !== undefined || hue !== undefined) {
      pipeline = pipeline.modulate({
        brightness: brightness || 1,
        saturation: saturation || 1,
        hue: hue || 0,
      })
    }

    if (gamma !== undefined) {
      pipeline = pipeline.gamma(gamma)
    }

    if (normalize) {
      pipeline = pipeline.normalize()
    }

    const data = await pipeline.toBuffer()
    const metadata = await sharp(data).metadata()

    return {
      success: true,
      data,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: data.length,
    }
  }

  // Create image collage
  async createCollage(
    images: Array<{
      input: Buffer | string
      width: number
      height: number
      x: number
      y: number
    }>,
    options: {
      width: number
      height: number
      background?: string
      format?: 'webp' | 'jpeg' | 'png'
      quality?: number
    }
  ): Promise<ImageOptimizationResult> {
    try {
      const { width, height, background = '#ffffff', format = 'webp', quality = 80 } = options

      // Create base image
      let pipeline = sharp({
        create: {
          width,
          height,
          channels: 3,
          background,
        },
      })

      // Composite images
      const composite = await Promise.all(
        images.map(async (img) => {
          const resized = await sharp(img.input)
            .resize(img.width, img.height)
            .toBuffer()

          return {
            input: resized,
            left: img.x,
            top: img.y,
          }
        })
      )

      pipeline = pipeline.composite(composite)

      // Apply format
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality })
          break
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality })
          break
        case 'png':
          pipeline = pipeline.png({ quality })
          break
      }

      const data = await pipeline.toBuffer()
      const metadata = await sharp(data).metadata()

      return {
        success: true,
        data,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: data.length,
      }

    } catch (error) {
      logger.error('Collage creation error:', {}, error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Collage creation failed',
      }
    }
  }

  // Validate image
  async validateImage(input: Buffer | string): Promise<{
    valid: boolean
    metadata?: ImageMetadata
    error?: string
  }> {
    try {
      const metadata = await this.getMetadata(input)

      // Check if image is valid
      if (metadata.width === 0 || metadata.height === 0) {
        return {
          valid: false,
          error: 'Invalid image dimensions',
        }
      }

      // Check if format is supported
      const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'tiff', 'svg']
      if (!supportedFormats.includes(metadata.format)) {
        return {
          valid: false,
          error: `Unsupported image format: ${metadata.format}`,
        }
      }

      return {
        valid: true,
        metadata,
      }

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Image validation failed',
      }
    }
  }
}

// Create singleton instance
export const imageOptimizer = new ImageOptimizationService()

// Utility functions
export async function optimizeImage(
  input: Buffer | string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png' | 'avif'
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    background?: string
    blur?: boolean
    blurRadius?: number
    grayscale?: boolean
    normalize?: boolean
    gamma?: number
    brightness?: number
    contrast?: number
    saturation?: number
    hue?: number
  } = {}
): Promise<ImageOptimizationResult> {
  return imageOptimizer.optimizeImage(input, options)
}

export async function generateResponsiveSizes(
  input: Buffer | string,
  baseName: string
): Promise<Record<string, ImageOptimizationResult>> {
  return imageOptimizer.generateResponsiveSizes(input, baseName)
}

export async function createThumbnail(
  input: Buffer | string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): Promise<ImageOptimizationResult> {
  return imageOptimizer.createThumbnail(input, options)
}

export async function getImageMetadata(input: Buffer | string): Promise<ImageMetadata> {
  return imageOptimizer.getMetadata(input)
}

export async function convertImageFormat(
  input: Buffer | string,
  targetFormat: 'webp' | 'jpeg' | 'png' | 'avif',
  quality?: number
): Promise<ImageOptimizationResult> {
  return imageOptimizer.convertFormat(input, targetFormat, quality)
}

export async function validateImage(input: Buffer | string): Promise<{
  valid: boolean
  metadata?: ImageMetadata
  error?: string
}> {
  return imageOptimizer.validateImage(input)
}


