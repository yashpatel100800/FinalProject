import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import RentalModel from '@/models/Rental'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'renting' // 'renting' or 'lending'

    let query: any = {}
    
    if (type === 'renting') {
      // Find rentals where user is the renter
      query.renter = (session.user as any).id
    } else {
      // Find rentals where user is the owner
      query.owner = (session.user as any).id
    }

    const rentals = await RentalModel.find(query)
      .populate('item', 'title images pricePerDay')
      .populate('renter', 'name image email')
      .populate('owner', 'name image email')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      rentals
    })

  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch rentals',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
