import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import RequestModel from '@/models/Request'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let query: any = {}

    // Filter by category
    if (category && category !== 'All Categories') {
      query.category = category
    }

    // Only show active requests
    query.isActive = true

    // Only show requests that haven't expired
    query.expiresAt = { $gte: new Date() }

    const requests = await RequestModel.find(query)
      .populate('user', 'name image email')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
