import { Resend } from 'resend'
import { logger } from './logger'

// Email configuration
const EMAIL_CONFIG = {
  FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@neoshop-ultra.com',
  FROM_NAME: process.env.RESEND_FROM_NAME || 'NEOSHOP ULTRA',
  REPLY_TO: process.env.RESEND_REPLY_TO || 'support@neoshop-ultra.com',
  
  // Email templates
  TEMPLATES: {
    WELCOME: 'welcome',
    ORDER_CONFIRMATION: 'order-confirmation',
    ORDER_SHIPPED: 'order-shipped',
    ORDER_DELIVERED: 'order-delivered',
    ORDER_CANCELLED: 'order-cancelled',
    PAYMENT_FAILED: 'payment-failed',
    PASSWORD_RESET: 'password-reset',
    EMAIL_VERIFICATION: 'email-verification',
    REVIEW_REMINDER: 'review-reminder',
    NEWSLETTER: 'newsletter',
    PROMOTIONAL: 'promotional',
  },
  
  // Email priorities
  PRIORITY: {
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
  },
  
  // Email categories
  CATEGORY: {
    TRANSACTIONAL: 'transactional',
    MARKETING: 'marketing',
    NOTIFICATION: 'notification',
    SYSTEM: 'system',
  },
} as const

// Email types
export type EmailTemplate = keyof typeof EMAIL_CONFIG.TEMPLATES
export type EmailPriority = keyof typeof EMAIL_CONFIG.PRIORITY
export type EmailCategory = keyof typeof EMAIL_CONFIG.CATEGORY

// Email recipient interface
export interface EmailRecipient {
  email: string
  name?: string
}

// Email attachment interface
export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  disposition?: 'attachment' | 'inline'
  cid?: string
}

// Email data interface
export interface EmailData {
  to: EmailRecipient | EmailRecipient[]
  cc?: EmailRecipient | EmailRecipient[]
  bcc?: EmailRecipient | EmailRecipient[]
  subject: string
  template?: EmailTemplate
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  priority?: EmailPriority
  category?: EmailCategory
  tags?: Record<string, string>
  metadata?: Record<string, any>
  replyTo?: string
  headers?: Record<string, string>
}

// Email result interface
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Resend email service class
export class EmailService {
  private resend!: Resend
  private isConfigured: boolean

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.isConfigured = !!apiKey
    
    if (this.isConfigured) {
      this.resend = new Resend(apiKey)
    } else {
      logger.warn('Resend API key not configured, email service will not work')
    }
  }

  // Send email
  async sendEmail(data: EmailData): Promise<EmailResult> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping email send')
      return {
        success: false,
        error: 'Email service not configured',
      }
    }

    try {
      // Prepare email data
      const emailData: any = {
        from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
        to: this.formatRecipients(data.to),
        cc: data.cc ? this.formatRecipients(data.cc) : undefined,
        bcc: data.bcc ? this.formatRecipients(data.bcc) : undefined,
        subject: data.subject,
        html: data.html,
        text: data.text,
        reply_to: data.replyTo || EMAIL_CONFIG.REPLY_TO,
        headers: data.headers,
        tags: data.tags,
        metadata: data.metadata,
      }

      // Send email
      const result = await this.resend.emails.send(emailData)

      if (result.error) {
        logger.error('Email send error:', result.error)
        return {
          success: false,
          error: result.error.message || 'Email send failed',
        }
      }

      logger.info('Email sent successfully', {
        messageId: result.data?.id,
        to: data.to,
        subject: data.subject,
        template: data.template,
        category: data.category,
      })

      return {
        success: true,
        messageId: result.data?.id,
      }

    } catch (error) {
      logger.error('Email service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      }
    }
  }

  // Send email using template
  async sendTemplateEmail(
    template: EmailTemplate,
    data: Omit<EmailData, 'template' | 'html' | 'text'> & {
      templateData?: Record<string, any>
    }
  ): Promise<EmailResult> {
    try {
      // Get template content
      const templateContent = await this.getTemplateContent(template, data.templateData || {})
      
      if (!templateContent) {
        return {
          success: false,
          error: `Template ${template} not found`,
        }
      }

      // Send email with template
      return this.sendEmail({
        ...data,
        html: templateContent.html,
        text: templateContent.text,
        template,
      })

    } catch (error) {
      logger.error('Template email error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template email failed',
      }
    }
  }

  // Send bulk emails
  async sendBulkEmails(
    emails: EmailData[],
    options: {
      batchSize?: number
      delay?: number
    } = {}
  ): Promise<EmailResult[]> {
    const { batchSize = 10, delay = 1000 } = options
    const results: EmailResult[] = []

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      
      // Send batch
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail(email))
      )

      // Process batch results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Email send failed',
          })
        }
      })

      // Delay between batches
      if (i + batchSize < emails.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return results
  }

  // Get template content
  private async getTemplateContent(template: EmailTemplate, data: Record<string, any>): Promise<{ html: string; text: string } | null> {
    try {
      // This would typically load from a template engine or file system
      // For now, we'll use simple template strings
      const templates = {
        [EMAIL_CONFIG.TEMPLATES.WELCOME]: {
          html: await this.getWelcomeTemplate(data),
          text: await this.getWelcomeTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.ORDER_CONFIRMATION]: {
          html: await this.getOrderConfirmationTemplate(data),
          text: await this.getOrderConfirmationTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.ORDER_SHIPPED]: {
          html: await this.getOrderShippedTemplate(data),
          text: await this.getOrderShippedTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.ORDER_DELIVERED]: {
          html: await this.getOrderDeliveredTemplate(data),
          text: await this.getOrderDeliveredTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.ORDER_CANCELLED]: {
          html: await this.getOrderCancelledTemplate(data),
          text: await this.getOrderCancelledTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.PAYMENT_FAILED]: {
          html: await this.getPaymentFailedTemplate(data),
          text: await this.getPaymentFailedTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.PASSWORD_RESET]: {
          html: await this.getPasswordResetTemplate(data),
          text: await this.getPasswordResetTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.EMAIL_VERIFICATION]: {
          html: await this.getEmailVerificationTemplate(data),
          text: await this.getEmailVerificationTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.REVIEW_REMINDER]: {
          html: await this.getReviewReminderTemplate(data),
          text: await this.getReviewReminderTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.NEWSLETTER]: {
          html: await this.getNewsletterTemplate(data),
          text: await this.getNewsletterTemplateText(data),
        },
        [EMAIL_CONFIG.TEMPLATES.PROMOTIONAL]: {
          html: await this.getPromotionalTemplate(data),
          text: await this.getPromotionalTemplateText(data),
        },
      } as Record<string, { html: string; text: string }>

      return templates[template] || null
    } catch (error) {
      logger.error('Template content error:', error)
      return null
    }
  }

  // Format recipients
  private formatRecipients(recipients: EmailRecipient | EmailRecipient[]): string[] {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients]
    return recipientArray.map(recipient => 
      recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
    )
  }

  // Template methods (simplified implementations)
  private async getWelcomeTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to NEOSHOP ULTRA</title>
        </head>
        <body>
          <h1>Welcome to NEOSHOP ULTRA!</h1>
          <p>Hello ${data.name || 'there'},</p>
          <p>Thank you for joining NEOSHOP ULTRA. We're excited to have you on board!</p>
          <p>Start shopping now and discover amazing products at great prices.</p>
          <a href="${data.shopUrl || '#'}">Start Shopping</a>
        </body>
      </html>
    `
  }

  private async getWelcomeTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Welcome to NEOSHOP ULTRA!
      
      Hello ${data.name || 'there'},
      
      Thank you for joining NEOSHOP ULTRA. We're excited to have you on board!
      
      Start shopping now and discover amazing products at great prices.
      
      Visit: ${data.shopUrl || '#'}
    `
  }

  private async getOrderConfirmationTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body>
          <h1>Order Confirmation</h1>
          <p>Hello ${data.customerName},</p>
          <p>Thank you for your order! We've received your order #${data.orderNumber} and it's being processed.</p>
          <h2>Order Details:</h2>
          <p>Order Total: $${data.orderTotal}</p>
          <p>Items: ${data.itemCount}</p>
          <a href="${data.orderUrl}">View Order</a>
        </body>
      </html>
    `
  }

  private async getOrderConfirmationTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Order Confirmation
      
      Hello ${data.customerName},
      
      Thank you for your order! We've received your order #${data.orderNumber} and it's being processed.
      
      Order Details:
      - Order Total: $${data.orderTotal}
      - Items: ${data.itemCount}
      
      View your order: ${data.orderUrl}
    `
  }

  private async getOrderShippedTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Shipped</title>
        </head>
        <body>
          <h1>Your Order Has Shipped!</h1>
          <p>Hello ${data.customerName},</p>
          <p>Great news! Your order #${data.orderNumber} has been shipped.</p>
          <p>Tracking Number: ${data.trackingNumber}</p>
          <p>Carrier: ${data.carrier}</p>
          <a href="${data.trackingUrl}">Track Your Package</a>
        </body>
      </html>
    `
  }

  private async getOrderShippedTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Your Order Has Shipped!
      
      Hello ${data.customerName},
      
      Great news! Your order #${data.orderNumber} has been shipped.
      
      Tracking Number: ${data.trackingNumber}
      Carrier: ${data.carrier}
      
      Track your package: ${data.trackingUrl}
    `
  }

  private async getOrderDeliveredTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Delivered</title>
        </head>
        <body>
          <h1>Order Delivered!</h1>
          <p>Hello ${data.customerName},</p>
          <p>Your order #${data.orderNumber} has been delivered!</p>
          <p>We hope you love your purchase. Please consider leaving a review.</p>
          <a href="${data.reviewUrl}">Leave a Review</a>
        </body>
      </html>
    `
  }

  private async getOrderDeliveredTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Order Delivered!
      
      Hello ${data.customerName},
      
      Your order #${data.orderNumber} has been delivered!
      
      We hope you love your purchase. Please consider leaving a review.
      
      Leave a review: ${data.reviewUrl}
    `
  }

  private async getOrderCancelledTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Cancelled</title>
        </head>
        <body>
          <h1>Order Cancelled</h1>
          <p>Hello ${data.customerName},</p>
          <p>Your order #${data.orderNumber} has been cancelled.</p>
          <p>Reason: ${data.cancellationReason}</p>
          <p>If you have any questions, please contact our support team.</p>
          <a href="${data.supportUrl}">Contact Support</a>
        </body>
      </html>
    `
  }

  private async getOrderCancelledTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Order Cancelled
      
      Hello ${data.customerName},
      
      Your order #${data.orderNumber} has been cancelled.
      
      Reason: ${data.cancellationReason}
      
      If you have any questions, please contact our support team.
      
      Contact support: ${data.supportUrl}
    `
  }

  private async getPaymentFailedTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
        </head>
        <body>
          <h1>Payment Failed</h1>
          <p>Hello ${data.customerName},</p>
          <p>We were unable to process the payment for your order #${data.orderNumber}.</p>
          <p>Please update your payment method and try again.</p>
          <a href="${data.paymentUrl}">Update Payment Method</a>
        </body>
      </html>
    `
  }

  private async getPaymentFailedTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Payment Failed
      
      Hello ${data.customerName},
      
      We were unable to process the payment for your order #${data.orderNumber}.
      
      Please update your payment method and try again.
      
      Update payment method: ${data.paymentUrl}
    `
  }

  private async getPasswordResetTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
        </head>
        <body>
          <h1>Password Reset Request</h1>
          <p>Hello ${data.name},</p>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${data.resetUrl}">Reset Password</a>
          <p>This link will expire in ${data.expiryHours} hours.</p>
        </body>
      </html>
    `
  }

  private async getPasswordResetTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Password Reset Request
      
      Hello ${data.name},
      
      You requested a password reset for your account.
      
      Click the link below to reset your password:
      ${data.resetUrl}
      
      This link will expire in ${data.expiryHours} hours.
    `
  }

  private async getEmailVerificationTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verification</title>
        </head>
        <body>
          <h1>Verify Your Email</h1>
          <p>Hello ${data.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${data.verificationUrl}">Verify Email</a>
          <p>This link will expire in ${data.expiryHours} hours.</p>
        </body>
      </html>
    `
  }

  private async getEmailVerificationTemplateText(data: Record<string, any>): Promise<string> {
    return `
      Verify Your Email
      
      Hello ${data.name},
      
      Please verify your email address by clicking the link below:
      ${data.verificationUrl}
      
      This link will expire in ${data.expiryHours} hours.
    `
  }

  private async getReviewReminderTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Review Reminder</title>
        </head>
        <body>
          <h1>How was your purchase?</h1>
          <p>Hello ${data.customerName},</p>
          <p>We hope you're enjoying your recent purchase!</p>
          <p>Please take a moment to leave a review for your order #${data.orderNumber}.</p>
          <a href="${data.reviewUrl}">Leave a Review</a>
        </body>
      </html>
    `
  }

  private async getReviewReminderTemplateText(data: Record<string, any>): Promise<string> {
    return `
      How was your purchase?
      
      Hello ${data.customerName},
      
      We hope you're enjoying your recent purchase!
      
      Please take a moment to leave a review for your order #${data.orderNumber}.
      
      Leave a review: ${data.reviewUrl}
    `
  }

  private async getNewsletterTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.subject || 'Newsletter'}</title>
        </head>
        <body>
          <h1>${data.title || 'Newsletter'}</h1>
          <p>Hello ${data.name},</p>
          ${data.content || '<p>Thank you for subscribing to our newsletter!</p>'}
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </body>
      </html>
    `
  }

  private async getNewsletterTemplateText(data: Record<string, any>): Promise<string> {
    return `
      ${data.subject || 'Newsletter'}
      
      Hello ${data.name},
      
      ${data.content || 'Thank you for subscribing to our newsletter!'}
      
      Unsubscribe: ${data.unsubscribeUrl}
    `
  }

  private async getPromotionalTemplate(data: Record<string, any>): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.subject || 'Special Offer'}</title>
        </head>
        <body>
          <h1>${data.title || 'Special Offer'}</h1>
          <p>Hello ${data.name},</p>
          ${data.content || '<p>Don\'t miss out on our special offer!</p>'}
          <a href="${data.offerUrl}">Shop Now</a>
        </body>
      </html>
    `
  }

  private async getPromotionalTemplateText(data: Record<string, any>): Promise<string> {
    return `
      ${data.subject || 'Special Offer'}
      
      Hello ${data.name},
      
      ${data.content || 'Don\'t miss out on our special offer!'}
      
      Shop now: ${data.offerUrl}
    `
  }
}

// Create singleton instance
export const emailService = new EmailService()

// Utility functions
export async function sendEmail(data: EmailData): Promise<EmailResult> {
  return emailService.sendEmail(data)
}

export async function sendTemplateEmail(
  template: EmailTemplate,
  data: Omit<EmailData, 'template' | 'html' | 'text'> & {
    templateData?: Record<string, any>
  }
): Promise<EmailResult> {
  return emailService.sendTemplateEmail(template, data)
}

export async function sendBulkEmails(
  emails: EmailData[],
  options: {
    batchSize?: number
    delay?: number
  } = {}
): Promise<EmailResult[]> {
  return emailService.sendBulkEmails(emails, options)
}


