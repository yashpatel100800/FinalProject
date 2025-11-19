import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'
import UserModel from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // Build query
    let query: any = { isActive: true }

    if (category && category !== 'all') {
      query.category = category
    }

    if (search) {
      query.$text = { $search: search }
    }

    if (minPrice || maxPrice) {
      query.pricePerDay = {}
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice)
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice)
    }

    // Fetch items
    const items = await ItemModel.find(query)
      .populate('owner', 'name email image')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({
      success: true,
      count: items.length,
      items
    })

  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch items',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
