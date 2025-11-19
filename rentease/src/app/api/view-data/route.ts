import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import ItemModel from '@/models/Item'
import RequestModel from '@/models/Request'
import RentalModel from '@/models/Rental'
import ReviewModel from '@/models/Review'
import { MessageModel } from '@/models/Message'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get counts of all data
    const userCount = await UserModel.countDocuments()
    const itemCount = await ItemModel.countDocuments()
    const requestCount = await RequestModel.countDocuments()
    const rentalCount = await RentalModel.countDocuments()
    const reviewCount = await ReviewModel.countDocuments()
    const messageCount = await MessageModel.countDocuments()

    // Get sample data from each collection
    const sampleItems = await ItemModel.find().populate('owner', 'name email').limit(3).lean()
    const sampleRequests = await RequestModel.find().populate('user', 'name email').limit(3).lean()
    const sampleRentals = await RentalModel.find()
      .populate('item', 'title pricePerDay')
      .populate('renter', 'name email')
      .populate('owner', 'name email')
      .limit(3)
      .lean()
    const sampleReviews = await ReviewModel.find()
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('item', 'title')
      .limit(3)
      .lean()
    const sampleMessages = await MessageModel.find()
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('relatedItem', 'title')
      .limit(5)
      .lean()

    return NextResponse.json({
      success: true,
      summary: {
        users: userCount,
        items: itemCount,
        requests: requestCount,
        rentals: rentalCount,
        reviews: reviewCount,
        messages: messageCount
      },
      sampleData: {
        items: sampleItems,
        requests: sampleRequests,
        rentals: sampleRentals,
        reviews: sampleReviews,
        messages: sampleMessages
      }
    })

  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}