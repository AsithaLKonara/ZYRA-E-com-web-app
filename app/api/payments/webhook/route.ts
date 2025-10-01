import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { paymentSecurity } from "@/lib/payment-security"
import { headers } from "next/headers"

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
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        console.log("Payment succeeded:", paymentIntent.id)
        
        // Update order status in database
        // await updateOrderStatus(paymentIntent.metadata.orderId, "paid")
        
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        console.log("Payment failed:", failedPayment.id)
        
        // Update order status in database
        // await updateOrderStatus(failedPayment.metadata.orderId, "payment_failed")
        
        break

      case "payment_method.attached":
        const paymentMethod = event.data.object
        console.log("Payment method attached:", paymentMethod.id)
        break

      case "customer.subscription.created":
        const subscription = event.data.object
        console.log("Subscription created:", subscription.id)
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object
        console.log("Subscription updated:", updatedSubscription.id)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object
        console.log("Subscription deleted:", deletedSubscription.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}