import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { emailService } from '@/lib/email-service'
import { logger } from '@/lib/logger'

// Get available email templates
async function getTemplatesHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can access email templates
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const templates = [
      {
        id: 'WELCOME',
        name: 'Welcome Email',
        description: 'Sent to new users after registration',
        category: 'transactional',
        variables: ['name', 'shopUrl'],
      },
      {
        id: 'ORDER_CONFIRMATION',
        name: 'Order Confirmation',
        description: 'Sent when an order is created',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'orderTotal', 'itemCount', 'orderUrl'],
      },
      {
        id: 'ORDER_SHIPPED',
        name: 'Order Shipped',
        description: 'Sent when an order is shipped',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'trackingNumber', 'carrier', 'trackingUrl'],
      },
      {
        id: 'ORDER_DELIVERED',
        name: 'Order Delivered',
        description: 'Sent when an order is delivered',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'reviewUrl'],
      },
      {
        id: 'ORDER_CANCELLED',
        name: 'Order Cancelled',
        description: 'Sent when an order is cancelled',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'cancellationReason', 'supportUrl'],
      },
      {
        id: 'PAYMENT_FAILED',
        name: 'Payment Failed',
        description: 'Sent when payment fails',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'paymentUrl'],
      },
      {
        id: 'PASSWORD_RESET',
        name: 'Password Reset',
        description: 'Sent when user requests password reset',
        category: 'transactional',
        variables: ['name', 'resetUrl', 'expiryHours'],
      },
      {
        id: 'EMAIL_VERIFICATION',
        name: 'Email Verification',
        description: 'Sent to verify email address',
        category: 'transactional',
        variables: ['name', 'verificationUrl', 'expiryHours'],
      },
      {
        id: 'REVIEW_REMINDER',
        name: 'Review Reminder',
        description: 'Sent to remind users to leave reviews',
        category: 'transactional',
        variables: ['customerName', 'orderNumber', 'reviewUrl'],
      },
      {
        id: 'NEWSLETTER',
        name: 'Newsletter',
        description: 'Regular newsletter to subscribers',
        category: 'marketing',
        variables: ['name', 'subject', 'title', 'content', 'unsubscribeUrl'],
      },
      {
        id: 'PROMOTIONAL',
        name: 'Promotional',
        description: 'Promotional emails and offers',
        category: 'marketing',
        variables: ['name', 'subject', 'title', 'content', 'offerUrl'],
      },
    ]

    logger.info('Email templates accessed', {
      userId: user.id,
      templateCount: templates.length,
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })

  } catch (error) {
    logger.error('Error getting email templates:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to get email templates' },
      { status: 500 }
    )
  }
}

// Test email template
async function testTemplateHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can test email templates
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { template, templateData, testEmail } = await request.json()

    // Validate input
    if (!template || !testEmail) {
      return NextResponse.json(
        { success: false, error: 'Template and test email are required' },
        { status: 400 }
      )
    }

    // Send test email
    const result = await emailService.sendTemplateEmail(template, {
      to: { email: testEmail, name: 'Test User' },
      subject: `Test Email - ${template}`,
      templateData: {
        name: 'Test User',
        ...templateData,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    logger.info('Test email sent', {
      userId: user.id,
      template,
      testEmail,
      messageId: result.messageId,
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        messageId: result.messageId,
      },
    })

  } catch (error) {
    logger.error('Error sending test email:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAuth(getTemplatesHandler)))
export const POST = withApiVersioning(withErrorHandler(withAuth(testTemplateHandler)))

