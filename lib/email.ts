import { Resend } from 'resend';
import { logger } from './logger';
import { monitoring } from './monitoring';

// Email templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailResult {
  id: string;
  to: string[];
  from: string;
  subject: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend | null;
  private fromEmail: string;
  private templates: Map<string, EmailTemplate> = new Map();
  private isConfigured: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.isConfigured = !!apiKey;
    
    if (this.isConfigured) {
      this.resend = new Resend(apiKey!);
    } else {
      // During build time or when API key is not set, don't throw error
      // This allows the app to build and run, but email functionality won't work
      this.resend = null;
      if (process.env.NODE_ENV !== 'test' && process.env.NEXT_PHASE !== 'phase-production-build') {
        logger.warn('RESEND_API_KEY not configured, email service will not work');
      }
    }

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@zyra-ultra.com';
    
    // Initialize default templates
    this.initializeTemplates();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize default email templates
   */
  private initializeTemplates() {
    // Welcome email template
    this.templates.set('welcome', {
      subject: 'Welcome to NeoShop Ultra!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to NeoShop Ultra</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to NeoShop Ultra!</h1>
              <p>Your account has been successfully created</p>
            </div>
            <div class="content">
              <h2>Hello {{name}}!</h2>
              <p>Thank you for joining NeoShop Ultra. We're excited to have you as part of our community!</p>
              <p>Your account is now ready to use. You can:</p>
              <ul>
                <li>Browse our extensive product catalog</li>
                <li>Create and share amazing reels</li>
                <li>Connect with other users</li>
                <li>Enjoy exclusive deals and promotions</li>
              </ul>
              <a href="{{loginUrl}}" class="button">Get Started</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 NeoShop Ultra. All rights reserved.</p>
              <p>This email was sent to {{email}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to NeoShop Ultra!
        
        Hello {{name}}!
        
        Thank you for joining NeoShop Ultra. We're excited to have you as part of our community!
        
        Your account is now ready to use. You can:
        - Browse our extensive product catalog
        - Create and share amazing reels
        - Connect with other users
        - Enjoy exclusive deals and promotions
        
        Get started: {{loginUrl}}
        
        If you have any questions, feel free to reach out to our support team.
        
        © 2024 NeoShop Ultra. All rights reserved.
        This email was sent to {{email}}
      `
    });

    // Password reset template
    this.templates.set('password-reset', {
      subject: 'Reset Your Password - NeoShop Ultra',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p>NeoShop Ultra Security</p>
            </div>
            <div class="content">
              <h2>Hello {{name}}!</h2>
              <p>We received a request to reset your password for your NeoShop Ultra account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="{{resetUrl}}" class="button">Reset Password</a>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in {{expiresIn}} hours for your security.
              </div>
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              <p>For security reasons, never share this link with anyone.</p>
            </div>
            <div class="footer">
              <p>© 2024 NeoShop Ultra. All rights reserved.</p>
              <p>This email was sent to {{email}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - NeoShop Ultra
        
        Hello {{name}}!
        
        We received a request to reset your password for your NeoShop Ultra account.
        
        Click the link below to reset your password:
        {{resetUrl}}
        
        Security Notice: This link will expire in {{expiresIn}} hours for your security.
        
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        
        For security reasons, never share this link with anyone.
        
        © 2024 NeoShop Ultra. All rights reserved.
        This email was sent to {{email}}
      `
    });

    // Order confirmation template
    this.templates.set('order-confirmation', {
      subject: 'Order Confirmation - NeoShop Ultra',
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="content">
              <h2>Hello {{name}}!</h2>
              <p>Your order has been confirmed and is being processed.</p>
              <div class="order-details">
                <h3>Order #{{orderNumber}}</h3>
                <p><strong>Order Date:</strong> {{orderDate}}</p>
                <p><strong>Shipping Address:</strong></p>
                <p>{{shippingAddress}}</p>
                <h4>Items:</h4>
                {{#each items}}
                <div class="item">
                  <span>{{name}} x {{quantity}}</span>
                  <span>{{price}}</span>
                </div>
                {{/each}}
                <div class="item total">
                  <span>Total:</span>
                  <span>{{total}}</span>
                </div>
              </div>
              <p>You can track your order status in your account dashboard.</p>
              <p>Thank you for choosing NeoShop Ultra!</p>
            </div>
            <div class="footer">
              <p>© 2024 NeoShop Ultra. All rights reserved.</p>
              <p>This email was sent to {{email}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: String.raw`
        Order Confirmation - NeoShop Ultra
        
        Hello {{name}}!
        
        Your order has been confirmed and is being processed.
        
        Order #{{orderNumber}}
        Order Date: {{orderDate}}
        Shipping Address: {{shippingAddress}}
        
        Items:
        {{#each items}}
        - {{name}} x {{quantity}} - {{price}}
        {{/each}}
        
        Total: {{total}}
        
        You can track your order status in your account dashboard.
        
        Thank you for choosing NeoShop Ultra!
        
        © 2024 NeoShop Ultra. All rights reserved.
        This email was sent to {{email}}
      `
    });

    // Reel notification template
    this.templates.set('reel-notification', {
      subject: 'New Reel from {{creatorName}} - NeoShop Ultra',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Reel</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reel-preview { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Reel Available!</h1>
              <p>Check out the latest content</p>
            </div>
            <div class="content">
              <h2>Hello {{name}}!</h2>
              <p>{{creatorName}} just shared a new reel that you might enjoy!</p>
              <div class="reel-preview">
                <h3>{{reelTitle}}</h3>
                <p>{{reelDescription}}</p>
                <a href="{{reelUrl}}" class="button">Watch Reel</a>
              </div>
              <p>Stay updated with the latest trends and discover amazing products through our community reels.</p>
            </div>
            <div class="footer">
              <p>© 2024 NeoShop Ultra. All rights reserved.</p>
              <p>This email was sent to {{email}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Reel from {{creatorName}} - NeoShop Ultra
        
        Hello {{name}}!
        
        {{creatorName}} just shared a new reel that you might enjoy!
        
        {{reelTitle}}
        {{reelDescription}}
        
        Watch reel: {{reelUrl}}
        
        Stay updated with the latest trends and discover amazing products through our community reels.
        
        © 2024 NeoShop Ultra. All rights reserved.
        This email was sent to {{email}}
      `
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    let subject = options.subject;

    try {
      let html = options.html;
      let text = options.text;

      // Use template if specified
      if (options.template) {
        const template = this.templates.get(options.template);
        if (!template) {
          throw new Error(`Template ${options.template} not found`);
        }

        subject = this.renderTemplate(template.subject, options.data || {});
        html = this.renderTemplate(template.html, options.data || {});
        text = template.text ? this.renderTemplate(template.text, options.data || {}) : undefined;
      }

      // Ensure subject is defined
      if (!subject) {
        throw new Error('Subject is required when not using a template');
      }

      // Send email
      const emailData: any = {
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject,
        attachments: options.attachments,
        tags: options.tags
      };

      // Add content based on what's available
      if (html) {
        emailData.html = html;
      }
      if (text) {
        emailData.text = text;
      }

      // Check if email service is configured
      if (!this.resend) {
        throw new Error('Email service not configured (RESEND_API_KEY missing)');
      }

      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const emailResult: EmailResult = {
        id: result.data?.id || '',
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.fromEmail,
        subject,
        sentAt: new Date(),
        status: 'sent'
      };

      logger.info('Email sent successfully', {
        emailId: emailResult.id,
        to: emailResult.to,
        subject,
        sendTime: Date.now() - startTime
      });

      monitoring.recordMetric('email_sent', 1);
      monitoring.recordMetric('email_send_duration', Date.now() - startTime);

      return emailResult;
    } catch (error) {
      logger.error('Email sending failed', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject
      });

      monitoring.recordMetric('email_failed', 1);

      return {
        id: '',
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.fromEmail,
        subject: subject || 'Email',
        sentAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string, loginUrl: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      template: 'welcome',
      data: {
        name,
        email: to,
        loginUrl
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string, 
    name: string, 
    resetUrl: string, 
    expiresIn: number = 24
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      template: 'password-reset',
      data: {
        name,
        email: to,
        resetUrl,
        expiresIn
      }
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    to: string,
    name: string,
    orderData: {
      orderNumber: string;
      orderDate: string;
      shippingAddress: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
    }
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      template: 'order-confirmation',
      data: {
        name,
        email: to,
        ...orderData
      }
    });
  }

  /**
   * Send reel notification email
   */
  async sendReelNotificationEmail(
    to: string,
    name: string,
    reelData: {
      creatorName: string;
      reelTitle: string;
      reelDescription: string;
      reelUrl: string;
    }
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      template: 'reel-notification',
      data: {
        name,
        email: to,
        ...reelData
      }
    });
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    // Simple template rendering (replace {{variable}} with values)
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });

    // Handle loops (simple implementation)
    const loopRegex = /{{#each\s+(\w+)}}(.*?){{\/each}}/gs;
    rendered = rendered.replace(loopRegex, (match, arrayKey, content) => {
      const array = data[arrayKey];
      if (!Array.isArray(array)) return '';

      return array.map(item => {
        let itemContent = content;
        Object.keys(item).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemContent = itemContent.replace(regex, item[key] || '');
        });
        return itemContent;
      }).join('');
    });

    return rendered;
  }

  /**
   * Add custom template
   */
  addTemplate(name: string, template: EmailTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Get template
   */
  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * List all templates
   */
  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    emails: Array<{
      to: string;
      options: Omit<EmailOptions, 'to'>;
    }>
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(({ to, options }) => 
        this.sendEmail({ ...options, to })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
