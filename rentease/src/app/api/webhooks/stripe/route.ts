import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('⚠️  Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    await connectDB()

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('💰 PaymentIntent succeeded:', paymentIntent.id)
        
        // Update rental payment status
        await RentalModel.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { 
            paymentStatus: 'paid',
            rentalStatus: 'requested' // Waiting for owner approval
          }
        )
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('❌ Payment failed:', failedPayment.id)
        
        // Update rental to failed
        await RentalModel.findOneAndUpdate(
          { stripePaymentIntentId: failedPayment.id },
          { 
            paymentStatus: 'pending',
            rentalStatus: 'cancelled'
          }
        )
        break

      case 'charge.refunded':
        const refund = event.data.object
        console.log('💸 Charge refunded:', refund.id)
        
        // Update rental refund status
        await RentalModel.findOneAndUpdate(
          { stripePaymentIntentId: refund.payment_intent },
          { paymentStatus: 'refunded' }
        )
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}
