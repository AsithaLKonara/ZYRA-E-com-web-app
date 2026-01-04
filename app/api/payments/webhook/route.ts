import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { paymentSecurity } from "@/lib/payment-security"
import { headers } from "next/headers"
import { logger } from "@/lib/logger"
import { db as prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get("stripe-signature")

  if (!signature) {
    await paymentSecurity.logSecurityEvent(
      "webhook_no_signature",
      { ip: request.headers.get("x-forwarded-for") },
      100
    )
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logger.error("Webhook signature verification failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as any
        logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id })
        
        // Find payment by Stripe payment intent ID
        const payment = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: { order: true },
        })

        if (payment) {
          // Update payment and order status in database
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCEEDED',
                stripeChargeId: paymentIntent.latest_charge as string | undefined,
                updatedAt: new Date(),
              },
            }),
            prisma.order.update({
              where: { id: payment.orderId },
              data: {
                status: 'PROCESSING',
                updatedAt: new Date(),
              },
            }),
          ])
          logger.info("Payment and order updated successfully", {
            paymentId: payment.id,
            orderId: payment.orderId,
          })
        } else {
          logger.warn("Payment not found for payment intent", {
            paymentIntentId: paymentIntent.id,
          })
        }
        
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as any
        logger.warn("Payment failed", { paymentIntentId: failedPayment.id })
        
        // Find payment by Stripe payment intent ID
        const failedPaymentRecord = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: failedPayment.id },
        })

        if (failedPaymentRecord) {
          // Update payment status to failed
          await prisma.payment.update({
            where: { id: failedPaymentRecord.id },
            data: {
              status: 'FAILED',
              updatedAt: new Date(),
            },
          })
          logger.info("Payment status updated to failed", {
            paymentId: failedPaymentRecord.id,
          })
        } else {
          logger.warn("Payment not found for failed payment intent", {
            paymentIntentId: failedPayment.id,
          })
        }
        
        break

      case "payment_method.attached":
        const paymentMethod = event.data.object
        logger.info("Payment method attached", { paymentMethodId: paymentMethod.id })
        break

      case "customer.subscription.created":
        const subscription = event.data.object
        logger.info("Subscription created", { subscriptionId: subscription.id })
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object
        logger.info("Subscription updated", { subscriptionId: updatedSubscription.id })
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object
        logger.info("Subscription deleted", { subscriptionId: deletedSubscription.id })
        break

      default:
        logger.info(`Unhandled event type: ${event.type}`, { eventType: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error("Error processing webhook", {}, error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}