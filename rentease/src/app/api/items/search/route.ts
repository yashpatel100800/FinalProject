import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ItemModel from '@/models/Item'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRating = searchParams.get('minRating')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const location = searchParams.get('location')
    const radius = searchParams.get('radius') // in miles
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Build the MongoDB query
    let searchQuery: any = {
      isActive: true
    }

    // Text search
    if (query) {
      searchQuery.$text = { $search: query }
    }

    // Category filter
    if (category && category !== 'All Categories') {
      searchQuery.category = category
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.pricePerDay = {}
      if (minPrice) searchQuery.pricePerDay.$gte = parseFloat(minPrice)
      if (maxPrice) searchQuery.pricePerDay.$lte = parseFloat(maxPrice)
    }

    // Rating filter
    if (minRating) {
      searchQuery.rating = { $gte: parseFloat(minRating) }
    }

    // Location-based search
    if (location && radius) {
      try {
        // Parse location coordinates (expects format: "lat,lng")
        const [lat, lng] = location.split(',').map(parseFloat)
        const radiusInMeters = parseFloat(radius) * 1609.34 // Convert miles to meters

        searchQuery['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        }
      } catch (error) {
        console.error('Invalid location format:', error)
      }
    }

    // Availability date filter
    if (startDate && endDate) {
      const reqStartDate = new Date(startDate)
      const reqEndDate = new Date(endDate)

      searchQuery.availability = {
        $elemMatch: {
          isAvailable: true,
          startDate: { $lte: reqStartDate },
          endDate: { $gte: reqEndDate }
        }
      }
    }

    // Build sort object
    let sortObject: any = {}
    
    if (query && sortBy === 'relevance') {
      // Sort by text search score when searching
      sortObject = { score: { $meta: 'textScore' } }
      if (searchQuery.$text) {
        // Add text score projection
        searchQuery.score = { $meta: 'textScore' }
      }
    } else {
      sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1
    }

    // Execute query with pagination
    const skip = (page - 1) * limit

    const items = await ItemModel.find(searchQuery)
      .populate('owner', 'name image rating')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalItems = await ItemModel.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error searching items:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to search items',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
