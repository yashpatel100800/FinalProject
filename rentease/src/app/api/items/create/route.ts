import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      description,
      category,
      subcategory,
      pricePerDay,
      securityDeposit,
      condition,
      address,
      coordinates,
      images,
      tags
    } = body

    // Validate required fields
    if (!title || !description || !category || !pricePerDay || !securityDeposit || !address) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // Create availability for next 90 days
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90)

    // Create new item
    const newItem = await ItemModel.create({
      title,
      description,
      images: images || ['https://images.unsplash.com/photo-1560440021-33f9b867899d?w=500'],
      category,
      subcategory: subcategory || undefined,
      pricePerDay: parseFloat(pricePerDay),
      securityDeposit: parseFloat(securityDeposit),
      condition,
      availability: [{
        startDate,
        endDate,
        isAvailable: true
      }],
      location: {
        address,
        coordinates: coordinates || [-122.4194, 37.7749] // Default to SF if not provided
      },
      owner: session.user.id,
      tags: tags || [],
      rating: 0,
      totalRatings: 0,
      isActive: true
    })

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: {
        id: newItem._id,
        title: newItem.title,
        category: newItem.category,
        pricePerDay: newItem.pricePerDay
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
