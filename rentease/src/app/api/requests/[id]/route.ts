import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import RequestModel from '@/models/Request'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    const requestDoc = await RequestModel.findById(id)
      .populate('user', 'name email image phone')
      .lean()

    if (!requestDoc) {
      return NextResponse.json({
        success: false,
        message: 'Request not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      request: requestDoc
    })

  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
