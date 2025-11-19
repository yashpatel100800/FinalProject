import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'decline'

    // Find the rental
    const rental = await RentalModel.findById(id).populate('owner')

    if (!rental) {
      return NextResponse.json(
        { success: false, message: 'Rental not found' },
        { status: 404 }
      )
    }

    // Verify user is the owner
    if (rental.owner._id.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, message: 'Only the owner can approve rentals' },
        { status: 403 }
      )
    }

    // Check if rental is in 'requested' status
    if (rental.rentalStatus !== 'requested') {
      return NextResponse.json(
        { success: false, message: 'Rental cannot be modified in current status' },
        { status: 400 }
      )
    }

    // Update rental status based on action
    if (action === 'approve') {
      rental.rentalStatus = 'approved'
    } else if (action === 'decline') {
      rental.rentalStatus = 'cancelled'
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }

    await rental.save()
    await rental.populate('item renter owner')

    return NextResponse.json({
      success: true,
      rental,
      message: `Rental ${action}d successfully`,
    })
  } catch (error: any) {
    console.error('Error updating rental status:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update rental status' },
      { status: 500 }
    )
  }
}
