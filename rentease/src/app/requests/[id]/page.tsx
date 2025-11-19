'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

interface RequestDetails {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    image?: string
    phone?: string
  }
  title: string
  description: string
  category: string
  subcategory?: string
  maxBudgetPerDay: number
  location: {
    address: string
    coordinates: number[]
    radius: number
  }
  requiredDates: {
    startDate: string
    endDate: string
  }
  tags: string[]
  isActive: boolean
  createdAt: string
  expiresAt: string
}

interface MatchedItem {
  _id: string
  title: string
  description: string
  images: string[]
  pricePerDay: number
  owner: {
    _id: string
    name: string
    image?: string
  }
  rating: number
  totalRatings: number
  matchScore: number
}

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)

  useEffect(() => {
    fetchRequestDetails()
  }, [resolvedParams.id])

  const fetchRequestDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/requests/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setRequest(data.request)
      }
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const findMatches = async () => {
    try {
      setLoadingMatches(true)
      const response = await fetch(`/api/requests/${resolvedParams.id}/matches`)
      const data = await response.json()

      if (data.success) {
        setMatchedItems(data.matches)
      }
    } catch (error) {
      console.error('Error finding matches:', error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateDays = () => {
    if (!request) return 0
    const startDate = new Date(request.requiredDates.startDate)
    const endDate = new Date(request.requiredDates.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading request details...</div>
        </div>
      </Layout>
    )
  }

  if (!request) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Request not found</h2>
            <Button className="mt-4" onClick={() => router.push('/requests')}>
              Back to Requests
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const isOwnRequest = session?.user && (session.user as any).id === request.user._id

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/requests')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Requests
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{request.title}</h1>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${request.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              <span className="font-medium">{request.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Details</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{request.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  {request.category}
                </span>
                {request.subcategory && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {request.subcategory}
                  </span>
                )}
              </div>

              {request.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.tags.map((tag, idx) => (
                      <span key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Required Period</p>
                  <p className="font-medium text-gray-900">{calculateDays()} days</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDate(request.requiredDates.startDate)} to {formatDate(request.requiredDates.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Maximum Budget</p>
                  <p className="font-medium text-gray-900">${request.maxBudgetPerDay}/day</p>
                  <p className="text-xs text-gray-600 mt-1">Total: ${request.maxBudgetPerDay * calculateDays()}</p>
                </div>
              </div>
            </div>

            {/* Requester Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requester Information</h2>
              <div className="flex items-center gap-4">
                <img
                  src={request.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.user.name)}&background=random`}
                  alt={request.user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{request.user.name}</h3>
                  <p className="text-gray-600">{request.user.email}</p>
                  {request.user.phone && <p className="text-gray-600">{request.user.phone}</p>}
                </div>
                {!isOwnRequest && (
                  <Button variant="outline">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                  </Button>
                )}
              </div>
            </div>

            {/* Matched Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Available Matches</h2>
                <Button onClick={findMatches} disabled={loadingMatches}>
                  {loadingMatches ? 'Finding...' : 'Find Matches'}
                </Button>
              </div>

              {matchedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Click "Find Matches" to see available items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchedItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/items/${item._id}`)}
                    >
                      <img
                        src={item.images[0] || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">${item.pricePerDay}/day</p>
                            {item.matchScore && (
                              <p className="text-xs text-green-600 font-medium">{item.matchScore}% match</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{item.rating} ({item.totalRatings})</span>
                          </div>
                          <span>by {item.owner.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{request.location.address}</p>
                  <p className="text-sm text-gray-600 mt-1">Within {request.location.radius} miles</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnRequest ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Request</h2>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    Edit Request
                  </Button>
                  <Button className="w-full" variant="outline">
                    Close Request
                  </Button>
                  <Button className="w-full" variant="outline">
                    Delete Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Have a Match?</h2>
                <div className="space-y-3">
                  <Button className="w-full">
                    Offer Your Item
                  </Button>
                  <Button className="w-full" variant="outline">
                    Contact Requester
                  </Button>
                </div>
              </div>
            )}

            {/* Request Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-900">{new Date(request.expiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Request ID</span>
                  <span className="font-mono text-gray-900">{request._id.slice(-8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
