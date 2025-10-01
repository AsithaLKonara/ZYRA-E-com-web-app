import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api-versioning';
import { videoProcessor } from '@/lib/video-processing';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { z } from 'zod';

// Validation schemas
const processVideoSchema = z.object({
  inputUrl: z.string().url(),
  options: z.object({
    quality: z.enum(['low', 'medium', 'high']).optional(),
    format: z.enum(['mp4', 'webm', 'mov']).optional(),
    thumbnail: z.boolean().optional(),
    duration: z.number().positive().optional(),
    startTime: z.number().min(0).optional(),
    endTime: z.number().positive().optional(),
    watermark: z.object({
      text: z.string(),
      position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
      fontSize: z.number().positive().optional(),
      color: z.string().optional()
    }).optional(),
    filters: z.object({
      brightness: z.number().min(-1).max(1).optional(),
      contrast: z.number().min(0).max(2).optional(),
      saturation: z.number().min(0).max(2).optional(),
      blur: z.number().min(0).optional()
    }).optional()
  }).optional()
});

const getMetadataSchema = z.object({
  inputUrl: z.string().url()
});

// POST /api/video/process - Process video
const POSTHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { inputUrl, options = {} } = processVideoSchema.parse(body);

    logger.info('Video processing request', {
      inputUrl,
      options,
      timestamp: new Date().toISOString()
    });

    // Download input video (in production, this should be from a secure source)
    const inputPath = await downloadVideo(inputUrl);
    
    try {
      // Process video
      const result = await videoProcessor.processVideo({
        inputPath,
        ...options
      });

      if (!result.success) {
        throw new Error(result.error || 'Video processing failed');
      }

      // Upload processed video (in production, upload to cloud storage)
      const outputUrl = await uploadProcessedVideo(result.outputPath!);
      const thumbnailUrl = result.thumbnailPath ? await uploadThumbnail(result.thumbnailPath) : undefined;

      // Cleanup temporary files
      await videoProcessor.cleanup([inputPath, result.outputPath!, result.thumbnailPath].filter(Boolean) as string[]);

      const response = {
        success: true,
        data: {
          outputUrl,
          thumbnailUrl,
          metadata: result.metadata,
          processingTime: result.processingTime
        }
      };

      monitoring.recordMetric('video_processing_duration', Date.now() - startTime);
      monitoring.recordMetric('video_processing_success', 1);

      return NextResponse.json(response);
    } catch (error) {
      // Cleanup on error
      await videoProcessor.cleanup([inputPath]);
      throw error;
    }
  } catch (error) {
    logger.error('Video processing error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('video_processing_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Video processing failed',
        error: 'PROCESSING_ERROR'
      },
      { status: 500 }
    );
  }
};

// POST /api/video/process/metadata - Get video metadata
const getMetadataHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { inputUrl } = getMetadataSchema.parse(body);

    logger.info('Video metadata request', {
      inputUrl,
      timestamp: new Date().toISOString()
    });

    // Download input video
    const inputPath = await downloadVideo(inputUrl);
    
    try {
      // Get metadata
      const metadata = await videoProcessor.getMetadata(inputPath);
      
      // Cleanup
      await videoProcessor.cleanup([inputPath]);

      return NextResponse.json({
        success: true,
        data: { metadata }
      });
    } catch (error) {
      // Cleanup on error
      await videoProcessor.cleanup([inputPath]);
      throw error;
    }
  } catch (error) {
    logger.error('Video metadata error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get video metadata',
        error: 'METADATA_ERROR'
      },
      { status: 500 }
    );
  }
};

// Helper function to download video from URL
async function downloadVideo(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.mp4`;
  const filepath = `/tmp/${filename}`;
  
  await require('fs').promises.writeFile(filepath, Buffer.from(buffer));
  return filepath;
}

// Helper function to upload processed video
async function uploadProcessedVideo(filePath: string): Promise<string> {
  // In production, upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
  // For now, return a placeholder URL
  const filename = require('path').basename(filePath);
  return `https://storage.example.com/processed/${filename}`;
}

// Helper function to upload thumbnail
async function uploadThumbnail(filePath: string): Promise<string> {
  // In production, upload to cloud storage
  const filename = require('path').basename(filePath);
  return `https://storage.example.com/thumbnails/${filename}`;
}

export const POST = withApiVersioning(POSTHandler);
export const GET = withApiVersioning(getMetadataHandler);


