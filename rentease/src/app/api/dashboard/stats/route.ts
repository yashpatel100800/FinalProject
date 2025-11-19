import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'
import ItemModel from '@/models/Item'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const userId = (session.user as any).id

    // Get item count
    const itemCount = await ItemModel.countDocuments({ owner: userId })

    // Get active rentals (approved or active status)
    const activeRentals = await RentalModel.countDocuments({
      owner: userId,
      rentalStatus: { $in: ['approved', 'active'] },
    })

    // Calculate earnings from completed rentals this month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const completedRentals = await RentalModel.find({
      owner: userId,
      rentalStatus: 'completed',
      updatedAt: { $gte: firstDayOfMonth },
    }).select('totalAmount')

    const monthlyEarnings = completedRentals.reduce(
      (sum, rental) => sum + rental.totalAmount,
      0
    )

    // Calculate total lifetime earnings
    const allCompletedRentals = await RentalModel.find({
      owner: userId,
      rentalStatus: 'completed',
    }).select('totalAmount')

    const totalEarnings = allCompletedRentals.reduce(
      (sum, rental) => sum + rental.totalAmount,
      0
    )

    // Get recent activities (last 10 rentals)
    const recentActivities = await RentalModel.find({
      $or: [{ owner: userId }, { renter: userId }],
    })
      .populate('item', 'title images')
      .populate('renter', 'name email')
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean()

    // Get items rented out to others
    const itemsRentedOut = await RentalModel.find({
      owner: userId,
      rentalStatus: { $in: ['approved', 'active', 'returned'] },
    })
      .populate('item', 'title images pricePerDay')
      .populate('renter', 'name email')
      .sort({ startDate: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      stats: {
        itemCount,
        activeRentals,
        monthlyEarnings,
        totalEarnings,
      },
      recentActivities,
      itemsRentedOut,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
