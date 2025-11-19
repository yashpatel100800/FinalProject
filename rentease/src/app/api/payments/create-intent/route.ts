import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { itemId, rentalDays, startDate, endDate } = body

    // Validate input
    if (!itemId || !rentalDays || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch item details
    const item = await ItemModel.findById(itemId).populate('owner')

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }

    if (!item.isActive) {
      return NextResponse.json(
        { success: false, message: 'Item is not available' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const rentalCost = item.pricePerDay * rentalDays
    const securityDeposit = item.securityDeposit
    const totalAmount = rentalCost + securityDeposit

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        itemId: item._id.toString(),
        itemTitle: item.title,
        renterId: session.user.id,
        renterEmail: session.user.email || '',
        ownerId: item.owner._id.toString(),
        rentalDays: rentalDays.toString(),
        rentalCost: rentalCost.toString(),
        securityDeposit: securityDeposit.toString(),
        startDate,
        endDate,
      },
      description: `Rental: ${item.title} for ${rentalDays} days`,
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      breakdown: {
        rentalCost,
        securityDeposit,
        totalAmount,
      },
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
