import { put, del, head, list } from '@vercel/blob';
import { logger } from './logger';
import { monitoring } from './monitoring';

export interface UploadOptions {
  filename?: string;
  contentType?: string;
  access?: 'public' | 'private';
  addRandomSuffix?: boolean;
  cacheControlMaxAge?: number;
}

export interface UploadResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  size: number;
  uploadedAt: Date;
}

export interface BlobInfo {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: string;
}

export class BlobStorageManager {
  private static instance: BlobStorageManager;
  private uploadToken: string;

  constructor() {
    this.uploadToken = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!this.uploadToken) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
    }
  }

  static getInstance(): BlobStorageManager {
    if (!BlobStorageManager.instance) {
      BlobStorageManager.instance = new BlobStorageManager();
    }
    return BlobStorageManager.instance;
  }

  /**
   * Upload file to Vercel Blob Storage
   */
  async uploadFile(
    file: File | Buffer | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      const result = await put(options.filename || 'file', file, {
        access: options.access || 'public',
        addRandomSuffix: options.addRandomSuffix !== false,
        cacheControlMaxAge: options.cacheControlMaxAge || 31536000, // 1 year
        token: this.uploadToken
      });

      const uploadResult: UploadResult = {
        url: result.url,
        downloadUrl: result.downloadUrl,
        pathname: result.pathname,
        contentType: result.contentType,
        contentDisposition: result.contentDisposition,
        size: result.size,
        uploadedAt: new Date(result.uploadedAt)
      };

      logger.info('File uploaded successfully', {
        pathname: result.pathname,
        size: result.size,
        contentType: result.contentType,
        uploadTime: Date.now() - startTime
      });

      monitoring.recordMetric('file_upload_success', 1);
      monitoring.recordMetric('file_upload_duration', Date.now() - startTime);

      return uploadResult;
    } catch (error) {
      logger.error('File upload failed', {
        error: error instanceof Error ? error.message : String(error),
        filename: options.filename
      });

      monitoring.recordMetric('file_upload_error', 1);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Array<{ file: File | Buffer | string; options?: UploadOptions }>
  ): Promise<UploadResult[]> {
    const startTime = Date.now();
    
    try {
      const uploadPromises = files.map(({ file, options }) => 
        this.uploadFile(file, options)
      );

      const results = await Promise.all(uploadPromises);

      logger.info('Multiple files uploaded successfully', {
        count: results.length,
        totalTime: Date.now() - startTime
      });

      return results;
    } catch (error) {
      logger.error('Multiple file upload failed', {
        error: error instanceof Error ? error.message : String(error),
        fileCount: files.length
      });
      throw error;
    }
  }

  /**
   * Delete file from Vercel Blob Storage
   */
  async deleteFile(url: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await del(url, { token: this.uploadToken });

      logger.info('File deleted successfully', {
        url,
        deleteTime: Date.now() - startTime
      });

      monitoring.recordMetric('file_delete_success', 1);
    } catch (error) {
      logger.error('File deletion failed', {
        error: error instanceof Error ? error.message : String(error),
        url
      });

      monitoring.recordMetric('file_delete_error', 1);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(urls: string[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      const deletePromises = urls.map(url => this.deleteFile(url));
      await Promise.all(deletePromises);

      logger.info('Multiple files deleted successfully', {
        count: urls.length,
        totalTime: Date.now() - startTime
      });
    } catch (error) {
      logger.error('Multiple file deletion failed', {
        error: error instanceof Error ? error.message : String(error),
        fileCount: urls.length
      });
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(url: string): Promise<BlobInfo | null> {
    try {
      const response = await head(url, { token: this.uploadToken });
      
      if (!response) {
        return null;
      }

      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        size: response.size,
        uploadedAt: new Date(response.uploadedAt)
      };
    } catch (error) {
      logger.error('Failed to get file info', {
        error: error instanceof Error ? error.message : String(error),
        url
      });
      return null;
    }
  }

  /**
   * List files
   */
  async listFiles(options: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{
    blobs: BlobInfo[];
    hasMore: boolean;
    cursor?: string;
  }> {
    try {
      const result = await list({
        prefix: options.prefix,
        limit: options.limit || 100,
        cursor: options.cursor,
        token: this.uploadToken
      });

      const blobs: BlobInfo[] = result.blobs.map(blob => ({
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt)
      }));

      return {
        blobs,
        hasMore: result.hasMore,
        cursor: result.cursor
      };
    } catch (error) {
      logger.error('Failed to list files', {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      throw error;
    }
  }

  /**
   * Generate signed URL for private file access
   */
  async generateSignedUrl(url: string, expiresIn: number = 3600): Promise<string> {
    // Vercel Blob doesn't support signed URLs directly
    // For private files, you would need to implement your own authentication
    // This is a placeholder implementation
    logger.warn('Signed URL generation not implemented for Vercel Blob');
    return url;
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFileWithProgress(
    file: File | Buffer | string,
    options: UploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    // Vercel Blob doesn't support progress tracking directly
    // This is a placeholder implementation
    if (onProgress) {
      onProgress(0);
      setTimeout(() => onProgress(50), 100);
      setTimeout(() => onProgress(100), 200);
    }

    return this.uploadFile(file, options);
  }

  /**
   * Upload video with processing
   */
  async uploadVideo(
    file: File | Buffer | string,
    options: UploadOptions & {
      generateThumbnail?: boolean;
      quality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<{
    video: UploadResult;
    thumbnail?: UploadResult;
  }> {
    const startTime = Date.now();
    
    try {
      // Upload video file
      const videoResult = await this.uploadFile(file, {
        ...options,
        contentType: 'video/mp4'
      });

      let thumbnailResult: UploadResult | undefined;

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        try {
          // TODO: Implement thumbnail generation
          // For now, create a placeholder thumbnail
          const thumbnailBuffer = Buffer.from('placeholder thumbnail');
          thumbnailResult = await this.uploadFile(thumbnailBuffer, {
            filename: `${options.filename || 'video'}_thumb.jpg`,
            contentType: 'image/jpeg',
            access: options.access || 'public'
          });
        } catch (error) {
          logger.warn('Failed to generate thumbnail', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      logger.info('Video upload completed', {
        videoUrl: videoResult.url,
        thumbnailUrl: thumbnailResult?.url,
        uploadTime: Date.now() - startTime
      });

      return {
        video: videoResult,
        thumbnail: thumbnailResult
      };
    } catch (error) {
      logger.error('Video upload failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Upload image with resizing
   */
  async uploadImage(
    file: File | Buffer | string,
    options: UploadOptions & {
      sizes?: Array<{ width: number; height: number; quality?: number }>;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<{
    original: UploadResult;
    resized?: UploadResult[];
  }> {
    const startTime = Date.now();
    
    try {
      // Upload original image
      const originalResult = await this.uploadFile(file, {
        ...options,
        contentType: `image/${options.format || 'jpeg'}`
      });

      let resizedResults: UploadResult[] = [];

      // Generate resized versions if requested
      if (options.sizes && options.sizes.length > 0) {
        try {
          // TODO: Implement image resizing
          // For now, create placeholder resized images
          for (const size of options.sizes) {
            const resizedBuffer = Buffer.from(`placeholder ${size.width}x${size.height}`);
            const resizedResult = await this.uploadFile(resizedBuffer, {
              filename: `${options.filename || 'image'}_${size.width}x${size.height}.${options.format || 'jpeg'}`,
              contentType: `image/${options.format || 'jpeg'}`,
              access: options.access || 'public'
            });
            resizedResults.push(resizedResult);
          }
        } catch (error) {
          logger.warn('Failed to generate resized images', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      logger.info('Image upload completed', {
        originalUrl: originalResult.url,
        resizedCount: resizedResults.length,
        uploadTime: Date.now() - startTime
      });

      return {
        original: originalResult,
        resized: resizedResults.length > 0 ? resizedResults : undefined
      };
    } catch (error) {
      logger.error('Image upload failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles(olderThan: Date, prefix?: string): Promise<number> {
    try {
      let deletedCount = 0;
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await this.listFiles({
          prefix,
          limit: 100,
          cursor
        });

        const oldFiles = result.blobs.filter(blob => 
          blob.uploadedAt < olderThan
        );

        if (oldFiles.length > 0) {
          const urls = oldFiles.map(blob => blob.url);
          await this.deleteFiles(urls);
          deletedCount += urls.length;
        }

        hasMore = result.hasMore;
        cursor = result.cursor;
      }

      logger.info('Cleanup completed', {
        deletedCount,
        olderThan,
        prefix
      });

      return deletedCount;
    } catch (error) {
      logger.error('Cleanup failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Export singleton instance
export const blobStorage = BlobStorageManager.getInstance();

// Export individual functions for compatibility
export const uploadFile = (file: File | Buffer | string, options?: UploadOptions) => 
  blobStorage.uploadFile(file, options);

export const deleteFiles = (urls: string[]) => 
  blobStorage.deleteFiles(urls);

export const cleanupTempFiles = (olderThan: Date, prefix?: string) => 
  blobStorage.cleanupOldFiles(olderThan, prefix);