import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import RequestModel from '@/models/Request'
import ItemModel from '@/models/Item'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    // Get the request details
    const requestDoc = await RequestModel.findById(id).lean()

    if (!requestDoc) {
      return NextResponse.json({
        success: false,
        message: 'Request not found'
      }, { status: 404 })
    }

    const requestData = requestDoc as any

    // Find matching items based on criteria
    const query: any = {
      isActive: true
    }

    // 1. Match category
    if (requestData.category) {
      query.category = requestData.category
    }

    // 2. Match price range (items within budget)
    if (requestData.maxBudgetPerDay) {
      query.pricePerDay = { $lte: requestData.maxBudgetPerDay }
    }

    // Find all potential matches
    const items = await ItemModel.find(query)
      .populate('owner', 'name image email')
      .lean()

    // Calculate match score for each item
    const matchedItems = items.map((item: any) => {
      let matchScore = 0

      // Base score for category match (40 points)
      if (item.category === requestData.category) {
        matchScore += 40
      }

      // Price match score (30 points)
      const priceDiff = Math.abs(item.pricePerDay - requestData.maxBudgetPerDay)
      const priceScore = Math.max(0, 30 - (priceDiff / requestData.maxBudgetPerDay) * 30)
      matchScore += priceScore

      // Subcategory match (15 points)
      if (requestData.subcategory && item.subcategory === requestData.subcategory) {
        matchScore += 15
      }

      // Tags match (15 points)
      if (requestData.tags && requestData.tags.length > 0 && item.tags) {
        const matchingTags = item.tags.filter((tag: string) => 
          requestData.tags.some((reqTag: string) => 
            reqTag.toLowerCase() === tag.toLowerCase()
          )
        )
        const tagScore = (matchingTags.length / requestData.tags.length) * 15
        matchScore += tagScore
      }

      // TODO: Add location-based scoring using coordinates
      // For now, we'll assume all items are within range

      return {
        ...item,
        matchScore: Math.round(matchScore)
      }
    })

    // Sort by match score (highest first) and filter out low matches
    const sortedMatches = matchedItems
      .filter(item => item.matchScore >= 40) // Only show items with at least 40% match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20) // Limit to top 20 matches

    return NextResponse.json({
      success: true,
      matches: sortedMatches,
      total: sortedMatches.length
    })

  } catch (error) {
    console.error('Error finding matches:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to find matches',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
