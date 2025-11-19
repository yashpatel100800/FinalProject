'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Item {
  _id: string
  title: string
  description: string
  category: string
  pricePerDay: number
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

interface RecommendationSectionProps {
  title: string
  type: 'personalized' | 'popular' | 'trending' | 'similar'
  itemId?: string
  limit?: number
}

export default function RecommendationSection({ 
  title, 
  type, 
  itemId, 
  limit = 8 
}: RecommendationSectionProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    fetchRecommendations()
  }, [type, itemId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      })
      
      if (itemId) {
        params.append('itemId', itemId)
      }

      const response = await fetch(`/api/recommendations?${params}`)
      const data = await response.json()

      if (data.success) {
        setItems(data.recommendations)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-${type}`)
    if (container) {
      const scrollAmount = 320 // Width of one card plus gap
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      })
      setScrollPosition(newPosition)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        id={`scroll-${type}`}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <Link
            key={item._id}
            href={`/items/${item._id}`}
            className="flex-shrink-0 w-72 group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={item.images[0] || '/placeholder.jpg'}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">
                    ({item.totalRatings})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      ${item.pricePerDay}
                    </span>
                    <span className="text-sm text-gray-600">/day</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">
                      {item.location.address.split(',')[1]?.trim() || 'Location'}
                    </span>
                  </div>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {item.owner.image ? (
                    <Image
                      src={item.owner.image}
                      alt={item.owner.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  )}
                  <span className="text-sm text-gray-600 truncate">
                    {item.owner.name}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
