import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'
import RentalModel from '@/models/Rental'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, personalized, popular, trending, similar
    const itemId = searchParams.get('itemId') // for similar items
    const limit = parseInt(searchParams.get('limit') || '8')

    let recommendations: any = {
      personalized: [],
      popular: [],
      trending: [],
      similar: []
    }

    // Get personalized recommendations based on user history
    if ((type === 'all' || type === 'personalized') && session?.user?.id) {
      try {
        // Get user's rental history
        const userRentals = await RentalModel.find({
          renter: session.user.id,
          status: { $in: ['active', 'completed'] }
        })
          .populate('item')
          .limit(20)
          .sort({ createdAt: -1 })

        // Extract categories and tags from rented items
        const rentedCategories = new Set<string>()
        const rentedTags = new Set<string>()

        userRentals.forEach((rental: any) => {
          if (rental.item?.category) {
            rentedCategories.add(rental.item.category)
          }
          if (rental.item?.tags) {
            rental.item.tags.forEach((tag: string) => rentedTags.add(tag))
          }
        })

        // Find items in same categories or with similar tags
        const personalizedQuery: any = {
          isActive: true,
          owner: { $ne: session.user.id }
        }

        if (rentedCategories.size > 0 || rentedTags.size > 0) {
          personalizedQuery.$or = []
          
          if (rentedCategories.size > 0) {
            personalizedQuery.$or.push({ category: { $in: Array.from(rentedCategories) } })
          }
          
          if (rentedTags.size > 0) {
            personalizedQuery.$or.push({ tags: { $in: Array.from(rentedTags) } })
          }
        }

        recommendations.personalized = await ItemModel.find(personalizedQuery)
          .populate('owner', 'name image')
          .limit(limit)
          .sort({ rating: -1, totalRatings: -1 })
      } catch (error) {
        console.error('Error getting personalized recommendations:', error)
      }
    }

    // Get popular items (most rented)
    if (type === 'all' || type === 'popular') {
      try {
        // Aggregate rentals to find most popular items
        const popularItemIds = await RentalModel.aggregate([
          { $match: { status: { $in: ['active', 'completed'] } } },
          { $group: { _id: '$item', rentalCount: { $sum: 1 } } },
          { $sort: { rentalCount: -1 } },
          { $limit: limit }
        ])

        const itemIds = popularItemIds.map(item => item._id)

        recommendations.popular = await ItemModel.find({
          _id: { $in: itemIds },
          isActive: true
        })
          .populate('owner', 'name image')
          .sort({ rating: -1 })
      } catch (error) {
        console.error('Error getting popular recommendations:', error)
      }
    }

    // Get trending items (recently added with good ratings)
    if (type === 'all' || type === 'trending') {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        recommendations.trending = await ItemModel.find({
          isActive: true,
          createdAt: { $gte: thirtyDaysAgo },
          rating: { $gte: 4.0 }
        })
          .populate('owner', 'name image')
          .limit(limit)
          .sort({ totalRatings: -1, rating: -1, createdAt: -1 })
      } catch (error) {
        console.error('Error getting trending recommendations:', error)
      }
    }

    // Get similar items (same category, similar price range)
    if ((type === 'all' || type === 'similar') && itemId) {
      try {
        const sourceItem = await ItemModel.findById(itemId)

        if (sourceItem) {
          const priceMin = sourceItem.pricePerDay * 0.7 // 30% lower
          const priceMax = sourceItem.pricePerDay * 1.3 // 30% higher

          recommendations.similar = await ItemModel.find({
            _id: { $ne: itemId },
            isActive: true,
            category: sourceItem.category,
            pricePerDay: { $gte: priceMin, $lte: priceMax }
          })
            .populate('owner', 'name image')
            .limit(limit)
            .sort({ rating: -1, totalRatings: -1 })
        }
      } catch (error) {
        console.error('Error getting similar recommendations:', error)
      }
    }

    // If specific type requested, return only that type
    if (type !== 'all') {
      return NextResponse.json({
        success: true,
        recommendations: recommendations[type] || []
      })
    }

    // For 'all' type, return all categories
    return NextResponse.json({
      success: true,
      recommendations
    })

  } catch (error) {
    console.error('Error in recommendations API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
