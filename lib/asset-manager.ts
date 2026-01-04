import { config } from './config'
import { logger } from './logger'

// Asset types
export type AssetType = 'image' | 'video' | 'document' | 'other'

// Asset interface
export interface Asset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  type: AssetType
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Asset manager class
class AssetManager {
  private assets: Map<string, Asset> = new Map()
  private maxFileSize: number
  private allowedTypes: string[]

  constructor() {
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
    ]
  }

  // Validate file
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      }
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }

    return { valid: true }
  }

  // Generate unique filename
  generateFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    return `${timestamp}-${random}.${extension}`
  }

  // Determine asset type from MIME type
  getAssetType(mimeType: string): AssetType {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('application/pdf') || mimeType.startsWith('text/')) return 'document'
    return 'other'
  }

  // Create asset record
  createAsset(
    filename: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    metadata?: Record<string, any>
  ): Asset {
    const id = filename.split('.')[0] || filename
    const asset: Asset = {
      id,
      filename,
      originalName,
      mimeType,
      size,
      url,
      type: this.getAssetType(mimeType),
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.assets.set(id, asset)
    logger.info(`Asset created: ${filename}`, { id, type: asset.type, size })

    return asset
  }

  // Get asset by ID
  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  // Get assets by type
  getAssetsByType(type: AssetType): Asset[] {
    return Array.from(this.assets.values()).filter(asset => asset.type === type)
  }

  // Get all assets
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values())
  }

  // Update asset metadata
  updateAsset(id: string, metadata: Record<string, any>): boolean {
    const asset = this.assets.get(id)
    if (!asset) return false

    asset.metadata = { ...asset.metadata, ...metadata }
    asset.updatedAt = new Date()
    this.assets.set(id, asset)

    logger.info(`Asset updated: ${id}`, { metadata })
    return true
  }

  // Delete asset
  deleteAsset(id: string): boolean {
    const asset = this.assets.get(id)
    if (!asset) return false

    this.assets.delete(id)
    logger.info(`Asset deleted: ${id}`)

    return true
  }

  // Get asset statistics
  getStats(): {
    totalAssets: number
    totalSize: number
    byType: Record<AssetType, number>
    averageSize: number
  } {
    const assets = this.getAllAssets()
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
    const byType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1
      return acc
    }, {} as Record<AssetType, number>)

    return {
      totalAssets: assets.length,
      totalSize,
      byType,
      averageSize: assets.length > 0 ? totalSize / assets.length : 0,
    }
  }

  // Clean up old assets
  cleanupOldAssets(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffDate = new Date(Date.now() - maxAge)
    let cleaned = 0

    for (const [id, asset] of this.assets.entries()) {
      if (asset.createdAt < cutoffDate) {
        this.assets.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old assets`)
    }

    return cleaned
  }

  // Generate thumbnail URL (placeholder)
  generateThumbnailUrl(asset: Asset): string {
    if (asset.type === 'image') {
      return `${asset.url}?w=300&h=300&fit=cover`
    }
    return asset.url
  }

  // Get asset URL with transformations
  getTransformedUrl(asset: Asset, transformations: {
    width?: number
    height?: number
    quality?: number
    format?: string
  }): string {
    if (asset.type !== 'image') {
      return asset.url
    }

    const params = new URLSearchParams()
    if (transformations.width) params.set('w', transformations.width.toString())
    if (transformations.height) params.set('h', transformations.height.toString())
    if (transformations.quality) params.set('q', transformations.quality.toString())
    if (transformations.format) params.set('f', transformations.format)

    return `${asset.url}?${params.toString()}`
  }
}

// Asset manager instance
export const assetManager = new AssetManager()

// Export asset manager functions
export const assetUtils = {
  validateFile: (file: File) => assetManager.validateFile(file),
  generateFilename: (originalName: string) => assetManager.generateFilename(originalName),
  getAssetType: (mimeType: string) => assetManager.getAssetType(mimeType),
  createAsset: (
    filename: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    metadata?: Record<string, any>
  ) => assetManager.createAsset(filename, originalName, mimeType, size, url, metadata),
  getAsset: (id: string) => assetManager.getAsset(id),
  getAssetsByType: (type: AssetType) => assetManager.getAssetsByType(type),
  getAllAssets: () => assetManager.getAllAssets(),
  updateAsset: (id: string, metadata: Record<string, any>) => assetManager.updateAsset(id, metadata),
  deleteAsset: (id: string) => assetManager.deleteAsset(id),
  getStats: () => assetManager.getStats(),
  cleanupOldAssets: (maxAge?: number) => assetManager.cleanupOldAssets(maxAge),
  generateThumbnailUrl: (asset: Asset) => assetManager.generateThumbnailUrl(asset),
  getTransformedUrl: (asset: Asset, transformations: any) => assetManager.getTransformedUrl(asset, transformations),
}

