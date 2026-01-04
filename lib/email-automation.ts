import { emailService, EmailTemplate, EmailData } from './email-service'
import { logger } from './logger'
import { db } from './db-connection'

// Email automation configuration
const AUTOMATION_CONFIG = {
  // Trigger delays (in milliseconds)
  DELAYS: {
    WELCOME_EMAIL: 0, // Immediate
    ORDER_CONFIRMATION: 0, // Immediate
    ORDER_SHIPPED: 0, // Immediate
    ORDER_DELIVERED: 0, // Immediate
    ORDER_CANCELLED: 0, // Immediate
    PAYMENT_FAILED: 0, // Immediate
    REVIEW_REMINDER: 7 * 24 * 60 * 60 * 1000, // 7 days
    ABANDONED_CART: 24 * 60 * 60 * 1000, // 1 day
    LOW_STOCK_ALERT: 0, // Immediate
    PRICE_DROP_ALERT: 0, // Immediate
  },
  
  // Email frequency limits
  FREQUENCY_LIMITS: {
    DAILY: 24 * 60 * 60 * 1000,
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
    MONTHLY: 30 * 24 * 60 * 60 * 1000,
  },
  
  // Batch processing
  BATCH_SIZE: 100,
  BATCH_DELAY: 1000, // 1 second between batches
} as const

// Email automation types
export type AutomationTrigger = 
  | 'user_registration'
  | 'order_created'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_failed'
  | 'review_reminder'
  | 'abandoned_cart'
  | 'low_stock_alert'
  | 'price_drop_alert'

export interface AutomationJob {
  id: string
  trigger: AutomationTrigger
  userId?: string
  orderId?: string
  productId?: string
  scheduledFor: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  data: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Email automation service class
export class EmailAutomationService {
  private isRunning = false
  private processingInterval: NodeJS.Timeout | null = null

  // Start automation service
  start(): void {
    if (this.isRunning) {
      logger.warn('Email automation service is already running')
      return
    }

    this.isRunning = true
    logger.info('Email automation service started')

    // Process jobs every minute
    this.processingInterval = setInterval(() => {
      this.processJobs().catch(error => {
        logger.error('Error processing automation jobs:', {}, error instanceof Error ? error : new Error(String(error)))
      })
    }, 60 * 1000) // 1 minute
  }

  // Stop automation service
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Email automation service is not running')
      return
    }

    this.isRunning = false
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    logger.info('Email automation service stopped')
  }

  // Trigger automation
  async triggerAutomation(
    trigger: AutomationTrigger,
    data: {
      userId?: string
      orderId?: string
      productId?: string
      [key: string]: any
    }
  ): Promise<void> {
    try {
      const delay = this.getDelayForTrigger(trigger)
      const scheduledFor = new Date(Date.now() + delay)

      // Create automation job
      const job: AutomationJob = {
        id: this.generateJobId(),
        trigger,
        userId: data.userId,
        orderId: data.orderId,
        productId: data.productId,
        scheduledFor,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Save job to database (in a real implementation)
      await this.saveJob(job)

      logger.info('Automation triggered', {
        trigger,
        jobId: job.id,
        scheduledFor: job.scheduledFor,
        data,
      })

    } catch (error) {
      logger.error('Error triggering automation:', {}, error instanceof Error ? error : new Error(String(error)))
    }
  }

  // Process automation jobs
  private async processJobs(): Promise<void> {
    try {
      // Get pending jobs that are ready to process
      const jobs = await this.getPendingJobs()

      if (jobs.length === 0) {
        return
      }

      logger.info(`Processing ${jobs.length} automation jobs`)

      // Process jobs in batches
      for (let i = 0; i < jobs.length; i += AUTOMATION_CONFIG.BATCH_SIZE) {
        const batch = jobs.slice(i, i + AUTOMATION_CONFIG.BATCH_SIZE)
        
        await Promise.allSettled(
          batch.map(job => this.processJob(job))
        )

        // Delay between batches
        if (i + AUTOMATION_CONFIG.BATCH_SIZE < jobs.length) {
          await new Promise(resolve => setTimeout(resolve, AUTOMATION_CONFIG.BATCH_DELAY))
        }
      }

    } catch (error) {
      logger.error('Error processing automation jobs:', {}, error instanceof Error ? error : new Error(String(error)))
    }
  }

  // Process individual job
  private async processJob(job: AutomationJob): Promise<void> {
    try {
      // Update job status
      await this.updateJobStatus(job.id, 'processing')

      // Execute automation based on trigger
      let result: any = { success: false, error: 'Unknown trigger' }

      switch (job.trigger) {
        case 'user_registration':
          result = await this.handleUserRegistration(job)
          break
        case 'order_created':
          result = await this.handleOrderCreated(job)
          break
        case 'order_shipped':
          result = await this.handleOrderShipped(job)
          break
        case 'order_delivered':
          result = await this.handleOrderDelivered(job)
          break
        case 'order_cancelled':
          result = await this.handleOrderCancelled(job)
          break
        case 'payment_failed':
          result = await this.handlePaymentFailed(job)
          break
        case 'review_reminder':
          result = await this.handleReviewReminder(job)
          break
        case 'abandoned_cart':
          result = await this.handleAbandonedCart(job)
          break
        case 'low_stock_alert':
          result = await this.handleLowStockAlert(job)
          break
        case 'price_drop_alert':
          result = await this.handlePriceDropAlert(job)
          break
      }

      // Update job status
      if (result.success) {
        await this.updateJobStatus(job.id, 'completed')
        logger.info('Automation job completed', { jobId: job.id, trigger: job.trigger })
      } else {
        await this.handleJobFailure(job, result.error)
      }

    } catch (error) {
      logger.error('Error processing automation job:', {}, error instanceof Error ? error : new Error(String(error)))
      await this.handleJobFailure(job, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Handle user registration
  private async handleUserRegistration(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: job.userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const result = await emailService.sendTemplateEmail('WELCOME', {
        to: { email: user.email, name: user.name || undefined },
        subject: 'Welcome to NEOSHOP ULTRA!',
        templateData: {
          name: user.name,
          shopUrl: process.env.NEXTAUTH_URL + '/products',
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle order created
  private async handleOrderCreated(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('ORDER_CONFIRMATION', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `Order Confirmation - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          orderTotal: order.total,
          itemCount: order.items.length,
          orderUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle order shipped
  private async handleOrderShipped(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('ORDER_SHIPPED', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `Your Order Has Shipped - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          trackingNumber: job.data.trackingNumber,
          carrier: job.data.carrier,
          trackingUrl: job.data.trackingUrl,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle order delivered
  private async handleOrderDelivered(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('ORDER_DELIVERED', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `Your Order Has Been Delivered - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          reviewUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}/review`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle order cancelled
  private async handleOrderCancelled(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('ORDER_CANCELLED', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `Order Cancelled - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          cancellationReason: job.data.cancellationReason,
          supportUrl: `${process.env.NEXTAUTH_URL}/contact`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle payment failed
  private async handlePaymentFailed(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('PAYMENT_FAILED', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `Payment Failed - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          paymentUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}/payment`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle review reminder
  private async handleReviewReminder(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await db.order.findUnique({
        where: { id: job.orderId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const result = await emailService.sendTemplateEmail('REVIEW_REMINDER', {
        to: { email: order.user.email, name: order.user.name || undefined },
        subject: `How was your purchase? - #${order.orderNumber}`,
        templateData: {
          customerName: order.user.name,
          orderNumber: order.orderNumber,
          reviewUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}/review`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle abandoned cart
  private async handleAbandonedCart(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: job.userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const result = await emailService.sendTemplateEmail('PROMOTIONAL', {
        to: { email: user.email, name: user.name || undefined },
        subject: 'Don\'t forget your items!',
        templateData: {
          name: user.name,
          title: 'Complete Your Purchase',
          content: 'You have items waiting in your cart. Complete your purchase now!',
          offerUrl: `${process.env.NEXTAUTH_URL}/cart`,
        },
      })

      return { success: result.success, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle low stock alert
  private async handleLowStockAlert(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const product = await db.product.findUnique({
        where: { id: job.productId },
        select: { id: true, name: true, stock: true },
      })

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      // Get admin users
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
      })

      if (admins.length === 0) {
        return { success: false, error: 'No admin users found' }
      }

      // Send alert to all admins
      const results = await Promise.allSettled(
        admins.map(admin =>
          emailService.sendEmail({
            to: { email: admin.email, name: admin.name || undefined },
            subject: `Low Stock Alert - ${product.name}`,
            html: `
              <h1>Low Stock Alert</h1>
              <p>Product: ${product.name}</p>
              <p>Current Stock: ${product.stock}</p>
              <p>Please restock this product soon.</p>
            `,
            text: `Low Stock Alert - Product: ${product.name}, Current Stock: ${product.stock}`,
          })
        )
      )

      const successful = results.filter(result => result.status === 'fulfilled').length
      return { success: successful > 0, error: successful === 0 ? 'All emails failed' : undefined }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle price drop alert
  private async handlePriceDropAlert(job: AutomationJob): Promise<{ success: boolean; error?: string }> {
    try {
      const product = await db.product.findUnique({
        where: { id: job.productId },
        select: { id: true, name: true, price: true },
      })

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      // Get users who have this product in their wishlist
      const wishlistUsers = await db.wishlistItem.findMany({
        where: { productId: job.productId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (wishlistUsers.length === 0) {
        return { success: true, error: 'No users to notify' }
      }

      // Send price drop alert to users
      const results = await Promise.allSettled(
        wishlistUsers.map(wishlistItem =>
          emailService.sendTemplateEmail('PROMOTIONAL', {
            to: { email: wishlistItem.user.email, name: wishlistItem.user.name || undefined },
            subject: `Price Drop Alert - ${product.name}`,
            templateData: {
              name: wishlistItem.user.name,
              title: 'Price Drop Alert!',
              content: `The price of ${product.name} has dropped to $${product.price}. Don't miss out!`,
              offerUrl: `${process.env.NEXTAUTH_URL}/products/${product.id}`,
            },
          })
        )
      )

      const successful = results.filter(result => result.status === 'fulfilled').length
      return { success: successful > 0, error: successful === 0 ? 'All emails failed' : undefined }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Get delay for trigger
  private getDelayForTrigger(trigger: AutomationTrigger): number {
    const delayKey = trigger.toUpperCase() as keyof typeof AUTOMATION_CONFIG.DELAYS
    return AUTOMATION_CONFIG.DELAYS[delayKey] || 0
  }

  // Generate job ID
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Save job (placeholder - would save to database in real implementation)
  private async saveJob(job: AutomationJob): Promise<void> {
    // In a real implementation, this would save to a database
    logger.info('Job saved', { jobId: job.id, trigger: job.trigger })
  }

  // Get pending jobs (placeholder - would query database in real implementation)
  private async getPendingJobs(): Promise<AutomationJob[]> {
    // In a real implementation, this would query the database
    return []
  }

  // Update job status (placeholder - would update database in real implementation)
  private async updateJobStatus(jobId: string, status: AutomationJob['status']): Promise<void> {
    // In a real implementation, this would update the database
    logger.info('Job status updated', { jobId, status })
  }

  // Handle job failure
  private async handleJobFailure(job: AutomationJob, error: string): Promise<void> {
    const newAttempts = job.attempts + 1

    if (newAttempts >= job.maxAttempts) {
      await this.updateJobStatus(job.id, 'failed')
      logger.error('Automation job failed permanently', {
        jobId: job.id,
        trigger: job.trigger,
        attempts: newAttempts,
        error,
      })
    } else {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, newAttempts) * 60 * 1000 // 2, 4, 8 minutes
      const retryTime = new Date(Date.now() + retryDelay)
      
      await this.updateJobStatus(job.id, 'pending')
      logger.warn('Automation job failed, will retry', {
        jobId: job.id,
        trigger: job.trigger,
        attempts: newAttempts,
        retryTime,
        error,
      })
    }
  }
}

// Create singleton instance
export const emailAutomation = new EmailAutomationService()

// Utility functions
export async function triggerAutomation(
  trigger: AutomationTrigger,
  data: {
    userId?: string
    orderId?: string
    productId?: string
    [key: string]: any
  }
): Promise<void> {
  return emailAutomation.triggerAutomation(trigger, data)
}

export function startEmailAutomation(): void {
  emailAutomation.start()
}

export function stopEmailAutomation(): void {
  emailAutomation.stop()
}


