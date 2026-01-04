import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api-versioning';
import { blobStorage } from '@/lib/blob-storage';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { z } from 'zod';

// Validation schemas
const uploadSchema = z.object({
  file: z.string(), // Base64 encoded file
  filename: z.string().optional(),
  contentType: z.string().optional(),
  access: z.enum(['public', 'private']).optional(),
  addRandomSuffix: z.boolean().optional(),
  cacheControlMaxAge: z.number().optional()
});

const uploadVideoSchema = z.object({
  file: z.string(), // Base64 encoded file
  filename: z.string().optional(),
  access: z.enum(['public', 'private']).optional(),
  generateThumbnail: z.boolean().optional(),
  quality: z.enum(['low', 'medium', 'high']).optional()
});

const uploadImageSchema = z.object({
  file: z.string(), // Base64 encoded file
  filename: z.string().optional(),
  access: z.enum(['public', 'private']).optional(),
  sizes: z.array(z.object({
    width: z.number(),
    height: z.number(),
    quality: z.number().optional()
  })).optional(),
  format: z.enum(['jpeg', 'png', 'webp']).optional()
});

// POST /api/upload - Upload file
const POSTHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { file, filename, contentType, access, addRandomSuffix, cacheControlMaxAge } = uploadSchema.parse(body);

    logger.info('File upload request', {
      filename,
      contentType,
      access,
      timestamp: new Date().toISOString()
    });

    // Decode base64 file
    const fileBuffer = Buffer.from(file, 'base64');

    // Upload file
    const result = await blobStorage.uploadFile(fileBuffer, {
      filename,
      contentType,
      access,
      addRandomSuffix,
      cacheControlMaxAge
    });

    const response = {
      success: true,
      data: result
    };

    monitoring.recordMetric('file_upload_duration', Date.now() - startTime);
    monitoring.recordMetric('file_upload_success', 1);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('File upload error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('file_upload_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'File upload failed',
        error: 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
};

// PUT /api/upload/video - Upload video with processing
const uploadVideoHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { file, filename, access, generateThumbnail, quality } = uploadVideoSchema.parse(body);

    logger.info('Video upload request', {
      filename,
      generateThumbnail,
      quality,
      timestamp: new Date().toISOString()
    });

    // Decode base64 file
    const fileBuffer = Buffer.from(file, 'base64');

    // Upload video
    const result = await blobStorage.uploadVideo(fileBuffer, {
      filename,
      access,
      generateThumbnail,
      quality
    });

    const response = {
      success: true,
      data: result
    };

    monitoring.recordMetric('video_upload_duration', Date.now() - startTime);
    monitoring.recordMetric('video_upload_success', 1);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Video upload error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('video_upload_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Video upload failed',
        error: 'VIDEO_UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
};

// PUT /api/upload/image - Upload image with resizing
const uploadImageHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { file, filename, access, sizes, format } = uploadImageSchema.parse(body);

    logger.info('Image upload request', {
      filename,
      sizes,
      format,
      timestamp: new Date().toISOString()
    });

    // Decode base64 file
    const fileBuffer = Buffer.from(file, 'base64');

    // Upload image
    const result = await blobStorage.uploadImage(fileBuffer, {
      filename,
      access,
      sizes,
      format
    });

    const response = {
      success: true,
      data: result
    };

    monitoring.recordMetric('image_upload_duration', Date.now() - startTime);
    monitoring.recordMetric('image_upload_success', 1);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Image upload error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('image_upload_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Image upload failed',
        error: 'IMAGE_UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
};

// DELETE /api/upload - Delete file
const deleteFileHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { url } = z.object({ url: z.string().url() }).parse(body);

    logger.info('File deletion request', {
      url,
      timestamp: new Date().toISOString()
    });

    // Delete file
    await blobStorage.deleteFile(url);

    const response = {
      success: true,
      message: 'File deleted successfully'
    };

    monitoring.recordMetric('file_delete_duration', Date.now() - startTime);
    monitoring.recordMetric('file_delete_success', 1);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('File deletion error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('file_delete_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'File deletion failed',
        error: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
};

// GET /api/upload - List files
const listFilesHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const cursor = searchParams.get('cursor') || undefined;

    logger.info('File list request', {
      prefix,
      limit,
      timestamp: new Date().toISOString()
    });

    // List files
    const result = await blobStorage.listFiles({
      prefix,
      limit,
      cursor
    });

    const response = {
      success: true,
      data: result
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('File list error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list files',
        error: 'LIST_ERROR'
      },
      { status: 500 }
    );
  }
};

// Route handlers based on HTTP method and content type
export const POST = withApiVersioning(POSTHandler);
export const PUT = withApiVersioning(async (request: NextRequest) => {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('video/')) {
    return uploadVideoHandler(request);
  } else if (contentType.includes('image/')) {
    return uploadImageHandler(request);
  } else {
    return POSTHandler(request);
  }
});
export const DELETE = withApiVersioning(deleteFileHandler);
export const GET = withApiVersioning(listFilesHandler);