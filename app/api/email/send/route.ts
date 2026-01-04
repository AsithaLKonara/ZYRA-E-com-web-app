import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api-versioning';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { z } from 'zod';

// Validation schemas
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.string().optional(),
  data: z.record(z.any()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    contentType: z.string().optional()
  })).optional(),
  tags: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional()
});

const sendWelcomeEmailSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  loginUrl: z.string().url()
});

const sendPasswordResetEmailSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  resetUrl: z.string().url(),
  expiresIn: z.number().optional()
});

const sendOrderConfirmationEmailSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  orderData: z.object({
    orderNumber: z.string(),
    orderDate: z.string(),
    shippingAddress: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number()
    })),
    total: z.number()
  })
});

const sendReelNotificationEmailSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  reelData: z.object({
    creatorName: z.string(),
    reelTitle: z.string(),
    reelDescription: z.string(),
    reelUrl: z.string().url()
  })
});

// POST /api/email/send - Send email
const POSTHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      to, 
      from, 
      subject, 
      html, 
      text, 
      template, 
      data, 
      attachments, 
      tags, 
      priority 
    } = sendEmailSchema.parse(body);

    logger.info('Email send request', {
      to,
      subject,
      template,
      timestamp: new Date().toISOString()
    });

    // Process attachments
    const processedAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType
    }));

    // Send email
    const result = await emailService.sendEmail({
      to,
      from,
      subject,
      html,
      text,
      template,
      data,
      attachments: processedAttachments,
      tags,
      priority
    });

    const response = {
      success: result.status === 'sent',
      data: result
    };

    monitoring.recordMetric('email_send_duration', Date.now() - startTime);
    monitoring.recordMetric('email_send_success', result.status === 'sent' ? 1 : 0);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Email send error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('email_send_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Email sending failed',
        error: 'EMAIL_SEND_ERROR'
      },
      { status: 500 }
    );
  }
};

// POST /api/email/send/welcome - Send welcome email
const sendWelcomeEmailHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { to, name, loginUrl } = sendWelcomeEmailSchema.parse(body);

    logger.info('Welcome email request', {
      to,
      name,
      timestamp: new Date().toISOString()
    });

    // Send welcome email
    const result = await emailService.sendWelcomeEmail(to, name, loginUrl);

    const response = {
      success: result.status === 'sent',
      data: result
    };

    monitoring.recordMetric('welcome_email_duration', Date.now() - startTime);
    monitoring.recordMetric('welcome_email_success', result.status === 'sent' ? 1 : 0);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Welcome email error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('welcome_email_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Welcome email sending failed',
        error: 'WELCOME_EMAIL_ERROR'
      },
      { status: 500 }
    );
  }
};

// POST /api/email/send/password-reset - Send password reset email
const sendPasswordResetEmailHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { to, name, resetUrl, expiresIn } = sendPasswordResetEmailSchema.parse(body);

    logger.info('Password reset email request', {
      to,
      name,
      timestamp: new Date().toISOString()
    });

    // Send password reset email
    const result = await emailService.sendPasswordResetEmail(to, name, resetUrl, expiresIn);

    const response = {
      success: result.status === 'sent',
      data: result
    };

    monitoring.recordMetric('password_reset_email_duration', Date.now() - startTime);
    monitoring.recordMetric('password_reset_email_success', result.status === 'sent' ? 1 : 0);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Password reset email error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('password_reset_email_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset email sending failed',
        error: 'PASSWORD_RESET_EMAIL_ERROR'
      },
      { status: 500 }
    );
  }
};

// POST /api/email/send/order-confirmation - Send order confirmation email
const sendOrderConfirmationEmailHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { to, name, orderData } = sendOrderConfirmationEmailSchema.parse(body);

    logger.info('Order confirmation email request', {
      to,
      name,
      orderNumber: orderData.orderNumber,
      timestamp: new Date().toISOString()
    });

    // Send order confirmation email
    const result = await emailService.sendOrderConfirmationEmail(to, name, orderData);

    const response = {
      success: result.status === 'sent',
      data: result
    };

    monitoring.recordMetric('order_confirmation_email_duration', Date.now() - startTime);
    monitoring.recordMetric('order_confirmation_email_success', result.status === 'sent' ? 1 : 0);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Order confirmation email error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('order_confirmation_email_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Order confirmation email sending failed',
        error: 'ORDER_CONFIRMATION_EMAIL_ERROR'
      },
      { status: 500 }
    );
  }
};

// POST /api/email/send/reel-notification - Send reel notification email
const sendReelNotificationEmailHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { to, name, reelData } = sendReelNotificationEmailSchema.parse(body);

    logger.info('Reel notification email request', {
      to,
      name,
      creatorName: reelData.creatorName,
      timestamp: new Date().toISOString()
    });

    // Send reel notification email
    const result = await emailService.sendReelNotificationEmail(to, name, reelData);

    const response = {
      success: result.status === 'sent',
      data: result
    };

    monitoring.recordMetric('reel_notification_email_duration', Date.now() - startTime);
    monitoring.recordMetric('reel_notification_email_success', result.status === 'sent' ? 1 : 0);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Reel notification email error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    monitoring.recordMetric('reel_notification_email_error', 1);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Reel notification email sending failed',
        error: 'REEL_NOTIFICATION_EMAIL_ERROR'
      },
      { status: 500 }
    );
  }
};

// Route handlers based on path
export const POST = withApiVersioning(async (request: NextRequest) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/welcome')) {
    return sendWelcomeEmailHandler(request);
  } else if (pathname.endsWith('/password-reset')) {
    return sendPasswordResetEmailHandler(request);
  } else if (pathname.endsWith('/order-confirmation')) {
    return sendOrderConfirmationEmailHandler(request);
  } else if (pathname.endsWith('/reel-notification')) {
    return sendReelNotificationEmailHandler(request);
  } else {
    return POSTHandler(request);
  }
});