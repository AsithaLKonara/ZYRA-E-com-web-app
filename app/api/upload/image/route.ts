import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { uploadFile } from '@/lib/blob-storage'
import { generateResponsiveSizes, createThumbnail, getImageMetadata } from '@/lib/image-optimization'
import { logger } from '@/lib/logger'

// Upload and optimize image
async function uploadImageHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string || 'product'
    const generateSizes = formData.get('generateSizes') === 'true'
    const createThumb = formData.get('createThumbnail') === 'true'

    // Validate input
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `File type .${fileExtension} is not allowed` },
        { status: 400 }
      )
    }

    // Validate file size (5MB max for images)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum of 5MB' },
        { status: 400 }
      )
    }

    // Get image metadata
    const fileBuffer = await file.arrayBuffer()
    const imageBuffer = Buffer.from(fileBuffer)
    const metadata = await getImageMetadata(imageBuffer)

    // Upload original image
    const uploadResult = await uploadFile(imageBuffer, {
      filename: file.name,
      contentType: file.type,
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      )
    }

    const result: any = {
      original: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
    }

    // Generate responsive sizes if requested
    if (generateSizes) {
      try {
        const responsiveSizes = await generateResponsiveSizes(imageBuffer, 'responsive')
        result.responsive = responsiveSizes
      } catch (error) {
        logger.error('Error generating responsive sizes:', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    // Create thumbnail if requested
    if (createThumb) {
      try {
        const thumbnailResult = await createThumbnail(imageBuffer, {
          width: 150,
          height: 150,
          quality: 80,
          format: 'webp',
        })

        if (thumbnailResult.success) {
          const thumbnailUpload = await uploadFile(thumbnailResult.data!, {
            filename: `thumb-${file.name}`,
            contentType: 'image/webp',
          })

          if (thumbnailUpload.success) {
            result.thumbnail = {
              url: thumbnailUpload.url,
              filename: thumbnailUpload.filename,
              size: thumbnailUpload.size,
              width: thumbnailResult.width,
              height: thumbnailResult.height,
              format: thumbnailResult.format,
            }
          }
        }
      } catch (error) {
        logger.error('Error creating thumbnail:', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    logger.info('Image uploaded and optimized', {
      userId: user.id,
      purpose,
      originalSize: file.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasResponsive: generateSizes,
      hasThumbnail: createThumb,
    })

    return NextResponse.json({
      success: true,
      message: 'Image uploaded and optimized successfully',
      data: result,
    })

  } catch (error) {
    logger.error('Image upload error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Image upload failed' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(withErrorHandler(withAuth(uploadImageHandler)))

