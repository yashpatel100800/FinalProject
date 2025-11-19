import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'
import UserModel from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized. Please sign in.'
      }, { status: 401 })
    }

    await connectDB()

    // Fetch user's items
    const items = await ItemModel.find({ owner: session.user.id, isActive: true })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      count: items.length,
      items
    })

  } catch (error) {
    console.error('Error fetching user items:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch items',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
