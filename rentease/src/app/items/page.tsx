'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/layout/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Item {
  _id: string
  title: string
  description: string
  images: string[]
  category: string
  subcategory?: string
  pricePerDay: number
  securityDeposit: number
  condition: string
  location: {
    address: string
  }
  owner: {
    _id: string
    name: string
    email: string
  }
  tags: string[]
  rating: number
  totalRatings: number
  isActive: boolean
}

export default function ItemsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    'all',
    'Electronics',
    'Tools & Equipment',
    'Sports & Recreation',
    'Home & Garden',
    'Automotive',
    'Party & Events',
    'Baby & Kids',
    'Other'
  ]

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items/list')
      const data = await response.json()

      if (response.ok) {
        setItems(data.items || [])
      } else {
        setError(data.message || 'Failed to fetch items')
      }
    } catch (err) {
      setError('An error occurred while fetching items')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading items...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Items</h1>
            <p className="mt-2 text-gray-600">
              {filteredItems.length} items available for rent
            </p>
          </div>
          {session && (
            <Button
              onClick={() => router.push('/items/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + List New Item
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === 'all' 
                ? "Be the first to list an item!" 
                : `No items in ${selectedCategory} category yet.`}
            </p>
            {session && (
              <Button
                onClick={() => router.push('/items/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                List Your First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <Card
                key={item._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/items/${item._id}`)}
              >
                {/* Item Image */}
                <div className="aspect-square relative bg-gray-200">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=500'
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${item.pricePerDay}
                      </span>
                      <span className="text-gray-600 text-sm">/day</span>
                    </div>
                    {item.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {item.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.totalRatings})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{item.location.address}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Owner: {item.owner.name}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </Layout>
  )
}
