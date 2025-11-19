import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'
import UserModel from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const item = await ItemModel.findById(id)
      .populate('owner', 'name email image')
      .lean()

    if (!item) {
      return NextResponse.json({
        success: false,
        message: 'Item not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      item
    })

  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch item',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
