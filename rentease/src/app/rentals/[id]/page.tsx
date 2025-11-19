'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

interface RentalDetails {
  _id: string
  item: {
    _id: string
    title: string
    description: string
    images: string[]
    pricePerDay: number
    category: string
  }
  renter: {
    _id: string
    name: string
    email: string
    image?: string
    phone?: string
  }
  owner: {
    _id: string
    name: string
    email: string
    image?: string
    phone?: string
  }
  startDate: string
  endDate: string
  totalAmount: number
  securityDeposit: number
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'disputed'
  rentalStatus: 'requested' | 'approved' | 'active' | 'returned' | 'completed' | 'cancelled'
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
}

export default function RentalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rental, setRental] = useState<RentalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'renter' | 'owner' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchRentalDetails()
    }
  }, [session, resolvedParams.id])

  const fetchRentalDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rentals/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setRental(data.rental)
        
        // Determine user role
        const userId = (session?.user as any)?.id
        if (data.rental.renter._id === userId) {
          setUserRole('renter')
        } else if (data.rental.owner._id === userId) {
          setUserRole('owner')
        }
      }
    } catch (error) {
      console.error('Error fetching rental details:', error)
    } finally {
      setLoading(false)
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
    if (!rental) return 0
    const startDate = new Date(rental.startDate)
    const endDate = new Date(rental.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleApprove = async () => {
    if (!rental) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/rentals/${rental._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Rental approved successfully!')
        fetchRentalDetails() // Refresh the data
      } else {
        alert(data.message || 'Failed to approve rental')
      }
    } catch (error) {
      console.error('Error approving rental:', error)
      alert('An error occurred while approving the rental')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!rental) return
    
    if (!confirm('Are you sure you want to decline this rental request?')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/rentals/${rental._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'decline' }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Rental declined')
        fetchRentalDetails() // Refresh the data
      } else {
        alert(data.message || 'Failed to decline rental')
      }
    } catch (error) {
      console.error('Error declining rental:', error)
      alert('An error occurred while declining the rental')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkAsReturned = async () => {
    if (!rental) return
    
    if (!confirm('Are you sure you want to mark this item as returned?')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/rentals/${rental._id}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'return' }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Item marked as returned. Waiting for owner confirmation.')
        fetchRentalDetails() // Refresh the data
      } else {
        alert(data.message || 'Failed to mark item as returned')
      }
    } catch (error) {
      console.error('Error marking item as returned:', error)
      alert('An error occurred while marking the item as returned')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReturn = async () => {
    if (!rental) return
    
    if (!confirm('Have you inspected the item? Confirming will complete the rental.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/rentals/${rental._id}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'confirm-return' }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Return confirmed! Rental completed successfully.')
        fetchRentalDetails() // Refresh the data
      } else {
        alert(data.message || 'Failed to confirm return')
      }
    } catch (error) {
      console.error('Error confirming return:', error)
      alert('An error occurred while confirming the return')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      returned: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'approved':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'active':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'returned':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'cancelled':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading rental details...</div>
        </div>
      </Layout>
    )
  }

  if (!rental) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Rental not found</h2>
            <Button className="mt-4" onClick={() => router.push('/rentals')}>
              Back to Rentals
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const otherParty = userRole === 'renter' ? rental.owner : rental.renter

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/rentals')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Rentals
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Rental Details</h1>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(rental.rentalStatus)}`}>
              {getStatusIcon(rental.rentalStatus)}
              <span className="font-medium">{rental.rentalStatus.charAt(0).toUpperCase() + rental.rentalStatus.slice(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
              <div className="flex gap-6">
                <img
                  src={rental.item.images[0] || '/placeholder.jpg'}
                  alt={rental.item.title}
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{rental.item.title}</h3>
                  <p className="text-gray-600 mb-4">{rental.item.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">{rental.item.category}</span>
                    <span className="text-gray-600">${rental.item.pricePerDay}/day</span>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push(`/items/${rental.item._id}`)}
                  >
                    View Item Page
                  </Button>
                </div>
              </div>
            </div>

            {/* Rental Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Period</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(rental.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(rental.endDate)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Total Duration:</span> {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {userRole === 'renter' ? 'Owner' : 'Renter'} Information
              </h2>
              <div className="flex items-center gap-4">
                <img
                  src={otherParty.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty.name)}&background=random`}
                  alt={otherParty.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{otherParty.name}</h3>
                  <p className="text-gray-600">{otherParty.email}</p>
                  {otherParty.phone && <p className="text-gray-600">{otherParty.phone}</p>}
                </div>
                <Button variant="outline">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rental Cost</span>
                  <span className="font-semibold">${rental.totalAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-semibold">${rental.securityDeposit}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-primary-600">${rental.totalAmount + rental.securityDeposit}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Payment Status:</span>{' '}
                    <span className={`font-semibold ${
                      rental.paymentStatus === 'paid' ? 'text-green-600' :
                      rental.paymentStatus === 'pending' ? 'text-yellow-600' :
                      rental.paymentStatus === 'refunded' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {rental.paymentStatus.charAt(0).toUpperCase() + rental.paymentStatus.slice(1)}
                    </span>
                  </p>
                  {rental.stripePaymentIntentId && (
                    <p className="text-xs text-gray-500 mt-1">ID: {rental.stripePaymentIntentId}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {rental.rentalStatus === 'requested' && userRole === 'owner' && (
                  <>
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve Rental'}
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={handleDecline}
                      disabled={actionLoading}
                    >
                      Decline
                    </Button>
                  </>
                )}
                
                {/* Renter marks as returned after rental period */}
                {rental.rentalStatus === 'active' && userRole === 'renter' && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={handleMarkAsReturned}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Mark as Returned'}
                  </Button>
                )}
                
                {/* Owner confirms return */}
                {rental.rentalStatus === 'returned' && userRole === 'owner' && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={handleConfirmReturn}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Return & Complete'}
                  </Button>
                )}
                
                {rental.rentalStatus === 'completed' && (
                  <Button className="w-full" variant="default">
                    Leave a Review
                  </Button>
                )}
                {rental.rentalStatus === 'active' && userRole === 'renter' && (
                  <Button className="w-full" variant="default">
                    Report an Issue
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  Contact Support
                </Button>
              </div>
            </div>

            {/* Rental Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental ID</span>
                  <span className="font-mono text-gray-900">{rental._id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">{new Date(rental.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-900">{new Date(rental.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
