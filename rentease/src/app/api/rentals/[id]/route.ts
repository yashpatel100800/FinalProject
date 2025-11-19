import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

    const rental = await RentalModel.findById(id)
      .populate('item', 'title description images pricePerDay category')
      .populate('renter', 'name email image phone')
      .populate('owner', 'name email image phone')
      .lean()

    if (!rental) {
      return NextResponse.json({
        success: false,
        message: 'Rental not found'
      }, { status: 404 })
    }

    // Verify user has access to this rental
    const userId = (session.user as any).id
    const rentalDoc = rental as any
    if (rentalDoc.renter._id.toString() !== userId && rentalDoc.owner._id.toString() !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to view this rental'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      rental
    })

  } catch (error) {
    console.error('Error fetching rental:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch rental',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
