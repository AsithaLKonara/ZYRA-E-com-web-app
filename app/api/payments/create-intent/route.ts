import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { paymentSecurity } from "@/lib/payment-security"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { amount, currency = "usd", metadata = {} } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Security validation
    const securityResult = await paymentSecurity.validatePaymentRequest(
      request,
      amount,
      currency.toUpperCase()
    )

    if (!securityResult.isValid) {
      await paymentSecurity.logSecurityEvent(
        "payment_blocked",
        { amount, currency, reason: securityResult.error },
        securityResult.riskScore || 0
      )

      return NextResponse.json(
        { error: securityResult.error },
        { status: 403 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: session.user.id,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    logger.error("Error creating payment intent", {}, error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}