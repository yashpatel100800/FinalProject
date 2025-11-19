import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'return' or 'confirm-return'

    const rental = await RentalModel.findById(id)
      .populate('item', 'title')
      .populate('renter', 'name')
      .populate('owner', 'name')

    if (!rental) {
      return NextResponse.json(
        { success: false, message: 'Rental not found' },
        { status: 404 }
      )
    }

    const userId = (session.user as any).id

    if (action === 'return') {
      // Renter wants to return the item
      if (rental.renter.toString() !== userId) {
        return NextResponse.json(
          { success: false, message: 'Only the renter can mark item as returned' },
          { status: 403 }
        )
      }

      if (rental.rentalStatus !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Only active rentals can be returned' },
          { status: 400 }
        )
      }

      rental.rentalStatus = 'returned' as any
      await rental.save()

      return NextResponse.json({
        success: true,
        message: 'Item marked as returned. Waiting for owner confirmation.',
        rental,
      })
    } else if (action === 'confirm-return') {
      // Owner confirms the return
      if (rental.owner.toString() !== userId) {
        return NextResponse.json(
          { success: false, message: 'Only the owner can confirm return' },
          { status: 403 }
        )
      }

      if (rental.rentalStatus !== 'returned' as any) {
        return NextResponse.json(
          { success: false, message: 'Item must be marked as returned first' },
          { status: 400 }
        )
      }

      rental.rentalStatus = 'completed'
      await rental.save()

      return NextResponse.json({
        success: true,
        message: 'Return confirmed. Rental completed successfully.',
        rental,
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error updating rental return status:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update rental' },
      { status: 500 }
    )
  }
}
