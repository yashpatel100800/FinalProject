'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox access token
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoieWFzaHBhdGVsMjAyNSIsImEiOiJjbThxaG4xNWwwbG11MmtzMXUzNHU2Y3lmIn0.ZXh5IgL8KnBpuHZLN8H8bQ'
}

interface Item {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  pricePerDay: number
  securityDeposit: number
  images: string[]
  rating: number
  totalRatings: number
  owner: {
    _id: string
    name: string
    image?: string
  }
  location: {
    address: string
    coordinates: number[]
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Tools & Equipment',
  'Sports & Recreation',
  'Party & Events',
  'Home & Garden',
  'Photography & Video',
  'Music & Audio',
  'Transportation',
  'Baby & Kids',
  'Books & Media',
  'Other'
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'pricePerDay-asc', label: 'Price: Low to High' },
  { value: 'pricePerDay-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'totalRatings', label: 'Most Reviewed' }
]

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [mapReady, setMapReady] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // Filter state
  const [filters, setFilters] = useState({
    query: searchParams.get('query') || '',
    category: searchParams.get('category') || 'All Categories',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    page: searchParams.get('page') || '1'
  })

  useEffect(() => {
    searchItems()
  }, [])

  // Initialize map
  useEffect(() => {
    if (viewMode !== 'map') return
    if (!mapContainer.current) return

    // Small delay to ensure container is rendered
    const initMap = () => {
      if (!map.current) {
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.4194, 37.7749], // San Francisco
            zoom: 10
          })

          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
          
          // Set map as ready when it loads
          map.current.on('load', () => {
            setMapReady(true)
          })
        } catch (error) {
          console.error('Error initializing map:', error)
        }
      } else {
        // Resize map when switching back to map view
        map.current.resize()
        setMapReady(true)
      }
    }

    // Use timeout to ensure DOM is ready
    const timer = setTimeout(initMap, 50)

    return () => {
      clearTimeout(timer)
      // Cleanup markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []
    }
  }, [viewMode])

  // Update map markers when items change
  useEffect(() => {
    if (!map.current || viewMode !== 'map' || !mapReady || items.length === 0) return

    // Wait a bit for map to be fully ready
    const timer = setTimeout(() => {
      if (!map.current) return

      // Clear existing markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      // Add markers for each item
      const bounds = new mapboxgl.LngLatBounds()

      items.forEach((item) => {
        const [lng, lat] = item.location.coordinates

        // Create custom marker HTML
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.width = '40px'
        el.style.height = '40px'
        el.style.backgroundImage = item.images[0] ? `url(${item.images[0]})` : 'none'
        el.style.backgroundColor = item.images[0] ? 'transparent' : '#3B82F6'
        el.style.backgroundSize = 'cover'
        el.style.backgroundPosition = 'center'
        el.style.borderRadius = '50%'
        el.style.border = '3px solid white'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        el.style.cursor = 'pointer'

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 10px; min-width: 200px;">
            ${item.images[0] ? `<img src="${item.images[0]}" alt="${item.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />` : ''}
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${item.title}</h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;">${item.category}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: #3B82F6;">$${item.pricePerDay}/day</span>
              <a href="/items/${item._id}" style="color: #3B82F6; text-decoration: none; font-size: 14px;">View →</a>
            </div>
          </div>
        `)

        // Create and add marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!)

        markers.current.push(marker)
        bounds.extend([lng, lat])
      })

      // Fit map to show all markers
      if (items.length > 0) {
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 13
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [items, viewMode, mapReady])

  const searchItems = async (newPage?: number) => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.query) params.append('query', filters.query)
      if (filters.category !== 'All Categories') params.append('category', filters.category)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.minRating) params.append('minRating', filters.minRating)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      // Handle sort
      const [sortField, sortOrder] = filters.sortBy.includes('-') 
        ? filters.sortBy.split('-') 
        : [filters.sortBy, 'desc']
      params.append('sortBy', sortField)
      params.append('sortOrder', sortOrder)
      params.append('page', (newPage || filters.page).toString())

      const response = await fetch(`/api/items/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setItems(data.items)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error searching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: '1' }))
  }

  const handleSearch = () => {
    searchItems(1)
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage.toString() }))
    searchItems(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'All Categories',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'createdAt',
      startDate: '',
      endDate: '',
      page: '1'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Items</h1>
          <p className="text-gray-600">
            Find the perfect item for your needs
            {pagination && ` - ${pagination.totalItems} items found`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <Input
                    type="text"
                    placeholder="Search items..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Per Day
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                {/* Availability Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      min={filters.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button
                  onClick={handleSearch}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Sort and Toggle Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Map
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort by:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => {
                      handleFilterChange('sortBy', e.target.value)
                      setTimeout(handleSearch, 0)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="relative">
                <div 
                  ref={mapContainer} 
                  className="w-full h-[600px] rounded-lg shadow-sm border border-gray-200 mb-6"
                  style={{ minHeight: '600px' }}
                />
                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items Grid */}
            {viewMode === 'grid' && (
              <>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Searching...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search filters</p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <Link
                      key={item._id}
                      href={`/items/${item._id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-200">
                        {item.images.length > 0 ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>

                        {/* Category */}
                        <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium mb-3">
                          {item.category}
                        </span>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(Math.round(item.rating))}
                          <span className="text-sm text-gray-600">
                            {item.rating.toFixed(1)} ({item.totalRatings})
                          </span>
                        </div>

                        {/* Price and Owner */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              ${item.pricePerDay}
                              <span className="text-sm font-normal text-gray-600">/day</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.owner.image && (
                              <Image
                                src={item.owner.image}
                                alt={item.owner.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            )}
                            <span className="text-xs text-gray-600">{item.owner.name}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      variant="outline"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded ${
                              pageNum === pagination.currentPage
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <Button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </Layout>
    }>
      <SearchContent />
    </Suspense>
  )
}
