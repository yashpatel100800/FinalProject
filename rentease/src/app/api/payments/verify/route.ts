import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'
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
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, message: 'Payment intent ID required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, message: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Check if rental already exists for this payment
    const existingRental = await RentalModel.findOne({ 
      stripePaymentIntentId: paymentIntentId 
    })

    if (existingRental) {
      return NextResponse.json({
        success: true,
        rental: existingRental,
        message: 'Rental already created',
      })
    }

    // Extract metadata
    const metadata = paymentIntent.metadata
    const itemId = metadata.itemId
    const renterId = metadata.renterId
    const ownerId = metadata.ownerId
    const startDate = new Date(metadata.startDate)
    const endDate = new Date(metadata.endDate)
    const rentalCost = parseFloat(metadata.rentalCost)
    const securityDeposit = parseFloat(metadata.securityDeposit)

    // Verify item exists
    const item = await ItemModel.findById(itemId)
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }

    // Create rental record
    const rental = await RentalModel.create({
      item: itemId,
      renter: renterId,
      owner: ownerId,
      startDate,
      endDate,
      totalAmount: rentalCost,
      securityDeposit,
      rentalStatus: 'requested', // Waiting for owner approval
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: 'paid',
    })

    // Populate rental with item and user details
    await rental.populate('item renter owner')

    return NextResponse.json({
      success: true,
      rental,
      message: 'Payment verified and rental created successfully',
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
