import Stripe from 'stripe'
import { config, paymentConfig } from './config'
import { logger } from './logger'

// Stripe configuration
const stripeConfig = {
  apiVersion: '2024-06-20' as const,
  appInfo: {
    name: 'NEOSHOP ULTRA',
    version: '1.0.0',
  },
}

// Initialize Stripe instances
export const stripe = new Stripe(paymentConfig.secretKey!, stripeConfig)

// Stripe utility functions
export class StripeService {
  // Create payment intent
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {}
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      logger.payment('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
      })

      return paymentIntent
    } catch (error) {
      logger.error('Error creating payment intent:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Retrieve payment intent
  static async getPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent
    } catch (error) {
      logger.error('Error retrieving payment intent:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Confirm payment intent
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      })

      logger.payment('Payment intent confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
      })

      return paymentIntent
    } catch (error) {
      logger.error('Error confirming payment intent:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create customer
  static async createCustomer(
    email: string,
    name?: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      })

      logger.payment('Customer created', {
        customerId: customer.id,
        email,
      })

      return customer
    } catch (error) {
      logger.error('Error creating customer:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Retrieve customer
  static async getCustomer(customerId: string) {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      return customer
    } catch (error) {
      logger.error('Error retrieving customer:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Update customer
  static async updateCustomer(
    customerId: string,
    updates: Stripe.CustomerUpdateParams
  ) {
    try {
      const customer = await stripe.customers.update(customerId, updates)

      logger.payment('Customer updated', {
        customerId,
        updates,
      })

      return customer
    } catch (error) {
      logger.error('Error updating customer:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create setup intent for saving payment methods
  static async createSetupIntent(
    customerId: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata,
      })

      logger.payment('Setup intent created', {
        setupIntentId: setupIntent.id,
        customerId,
      })

      return setupIntent
    } catch (error) {
      logger.error('Error creating setup intent:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // List customer payment methods
  static async getCustomerPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })

      return paymentMethods
    } catch (error) {
      logger.error('Error retrieving customer payment methods:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create refund
  static async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason,
      })

      logger.payment('Refund created', {
        refundId: refund.id,
        paymentIntentId,
        amount,
        reason,
      })

      return refund
    } catch (error) {
      logger.error('Error creating refund:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create webhook endpoint
  static async createWebhookEndpoint(
    url: string,
    events: string[]
  ) {
    try {
      const webhookEndpoint = await stripe.webhookEndpoints.create({
        url,
        enabled_events: events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      })

      logger.payment('Webhook endpoint created', {
        webhookEndpointId: webhookEndpoint.id,
        url,
        events,
      })

      return webhookEndpoint
    } catch (error) {
      logger.error('Error creating webhook endpoint:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret)
      return event
    } catch (error) {
      logger.error('Error verifying webhook signature:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create price for subscription (if needed)
  static async createPrice(
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    interval?: Stripe.PriceCreateParams.Recurring.Interval
  ) {
    try {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(unitAmount * 100),
        currency,
        recurring: interval ? { interval } : undefined,
      })

      logger.payment('Price created', {
        priceId: price.id,
        productId,
        unitAmount,
        currency,
        interval,
      })

      return price
    } catch (error) {
      logger.error('Error creating price:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create product
  static async createProduct(
    name: string,
    description?: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      const product = await stripe.products.create({
        name,
        description,
        metadata,
      })

      logger.payment('Product created', {
        productId: product.id,
        name,
      })

      return product
    } catch (error) {
      logger.error('Error creating product:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Export Stripe service
export default StripeService


