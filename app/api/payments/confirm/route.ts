import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stripe } from "@/lib/stripe"
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

    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      )
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Confirm payment intent
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)

    return NextResponse.json({
      status: confirmedPaymentIntent.status,
      paymentIntent: confirmedPaymentIntent
    })
  } catch (error) {
    logger.error("Error confirming payment", {}, error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}