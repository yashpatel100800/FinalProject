'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/layout/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RecommendationSection from '@/components/recommendations/RecommendationSection'

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
    image?: string
  }
  tags: string[]
  rating: number
  totalRatings: number
  createdAt: string
}

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const resolvedParams = use(params)
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rentalDays, setRentalDays] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchItem()
  }, [resolvedParams.id])

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${resolvedParams.id}`)
      const data = await response.json()

      if (response.ok) {
        setItem(data.item)
      } else {
        setError(data.message || 'Failed to fetch item')
      }
    } catch (err) {
      setError('An error occurred while fetching item details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleContactOwner = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    // Navigate to messages or open chat
    router.push(`/messages?item=${resolvedParams.id}&owner=${item?.owner._id}`)
  }

  const handleRequestRental = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      alert('Please select rental dates')
      return
    }
    
    // Navigate to checkout page with rental details
    const params = new URLSearchParams({
      itemId: resolvedParams.id,
      days: rentalDays.toString(),
      startDate,
      endDate,
    })
    
    router.push(`/checkout?${params.toString()}`)
  }

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
            <p className="mt-4 text-gray-600">Loading item details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This item does not exist or has been removed.'}</p>
            <Button onClick={() => router.push('/items')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Browse All Items
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const totalCost = item.pricePerDay * rentalDays

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video relative bg-gray-200">
                <img
                  src={item.images[currentImageIndex]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=500'
                  }}
                />
              </div>
              {item.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {item.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`${item.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Item Details */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.subcategory && (
                      <Badge variant="outline" className="bg-gray-50">{item.subcategory}</Badge>
                    )}
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                  {item.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.rating.toFixed(1)} ({item.totalRatings} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
              </div>

              {item.tags.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
                <div className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{item.location.address}</span>
                </div>
              </div>
            </Card>

            {/* Owner Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {item.owner.image ? (
                    <img src={item.owner.image} alt={item.owner.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    item.owner.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.owner.name}</h3>
                  <p className="text-sm text-gray-600">{item.owner.email}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Rental Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-blue-600">${item.pricePerDay}</span>
                  <span className="text-gray-600">/day</span>
                </div>
                <p className="text-sm text-gray-600">
                  Security Deposit: ${item.securityDeposit}
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    // Auto-calculate end date if rental days is set
                    if (e.target.value && rentalDays) {
                      const start = new Date(e.target.value)
                      const end = new Date(start)
                      end.setDate(start.getDate() + rentalDays)
                      setEndDate(end.toISOString().split('T')[0])
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  min={startDate || new Date().toISOString().split('T')[0]}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    // Auto-calculate rental days
                    if (startDate && e.target.value) {
                      const start = new Date(startDate)
                      const end = new Date(e.target.value)
                      const diffTime = end.getTime() - start.getTime()
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      if (diffDays > 0) {
                        setRentalDays(diffDays)
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="rentalDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <input
                  id="rentalDays"
                  type="number"
                  min="1"
                  max="30"
                  value={rentalDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 1
                    setRentalDays(days)
                    // Auto-calculate end date if start date is set
                    if (startDate) {
                      const start = new Date(startDate)
                      const end = new Date(start)
                      end.setDate(start.getDate() + days)
                      setEndDate(end.toISOString().split('T')[0])
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Rental ({rentalDays} days)</span>
                  <span className="font-medium">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">${item.securityDeposit.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-blue-600">
                      ${(totalCost + item.securityDeposit).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Deposit refunded after return
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleRequestRental}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!session || item.owner._id === session?.user?.id}
                >
                  {!session ? 'Sign In to Rent' : 
                   item.owner._id === session?.user?.id ? 'Your Item' : 
                   'Request to Rent'}
                </Button>
                <Button
                  onClick={handleContactOwner}
                  variant="outline"
                  className="w-full"
                  disabled={!session || item.owner._id === session?.user?.id}
                >
                  Contact Owner
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Payment processed securely. Owner must approve your request.
              </p>
            </Card>
          </div>
        </div>

        {/* Similar Items Section */}
        <div className="mt-16">
          <RecommendationSection 
            title="Similar Items You Might Like" 
            type="similar"
            itemId={resolvedParams.id}
            limit={8}
          />
        </div>
      </div>
      </div>
    </Layout>
  )
}
