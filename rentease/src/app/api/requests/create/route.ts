import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import RequestModel from '@/models/Request'
import UserModel from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized. Please sign in.'
      }, { status: 401 })
    }

    await connectDB()

    const user = await UserModel.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'maxBudgetPerDay', 'location', 'requiredDates']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          message: `Missing required field: ${field}`
        }, { status: 400 })
      }
    }

    // Validate dates
    const startDate = new Date(body.requiredDates.startDate)
    const endDate = new Date(body.requiredDates.endDate)
    
    if (startDate >= endDate) {
      return NextResponse.json({
        success: false,
        message: 'End date must be after start date'
      }, { status: 400 })
    }

    if (startDate < new Date()) {
      return NextResponse.json({
        success: false,
        message: 'Start date cannot be in the past'
      }, { status: 400 })
    }

    // For now, use placeholder coordinates - in real app would geocode the address
    const coordinates = body.location.coordinates || [-122.4194, 37.7749] // Default to SF

    const requestData = {
      user: user._id,
      title: body.title,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory || '',
      maxBudgetPerDay: body.maxBudgetPerDay,
      location: {
        address: body.location.address,
        coordinates: coordinates,
        radius: body.location.radius || 10
      },
      requiredDates: {
        startDate: startDate,
        endDate: endDate
      },
      tags: body.tags || [],
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    }

    const newRequest = await RequestModel.create(requestData)

    return NextResponse.json({
      success: true,
      message: 'Request created successfully!',
      request: newRequest
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
