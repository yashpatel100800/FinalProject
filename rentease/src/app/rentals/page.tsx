'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

interface Rental {
  _id: string
  item: {
    _id: string
    title: string
    images: string[]
    pricePerDay: number
  }
  renter: {
    _id: string
    name: string
    image?: string
  }
  owner: {
    _id: string
    name: string
    image?: string
  }
  startDate: string
  endDate: string
  totalAmount: number
  securityDeposit: number
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'disputed'
  rentalStatus: 'requested' | 'approved' | 'active' | 'completed' | 'cancelled'
  createdAt: string
}

export default function RentalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'renting' | 'lending'>('renting')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchRentals()
    }
  }, [session, activeTab])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rentals/my-rentals?type=${activeTab}`)
      const data = await response.json()

      if (data.success) {
        setRentals(data.rentals)
      }
    } catch (error) {
      console.error('Error fetching rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      paid: 'text-green-600',
      refunded: 'text-blue-600',
      disputed: 'text-red-600',
    }
    return colors[status] || 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredRentals = filterStatus === 'all' 
    ? rentals 
    : rentals.filter(rental => rental.rentalStatus === filterStatus)

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading rentals...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rentals</h1>
          <p className="text-gray-600 mt-2">Manage your rental transactions</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('renting')}
              className={`${
                activeTab === 'renting'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Items I'm Renting
            </button>
            <button
              onClick={() => setActiveTab('lending')}
              className={`${
                activeTab === 'lending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Items I'm Lending
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('requested')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'requested'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Rentals List */}
        {filteredRentals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'renting' 
                ? "You haven't rented any items yet. Browse available items to get started!"
                : "You don't have any items being rented out. List an item to start earning!"}
            </p>
            <Button onClick={() => router.push('/items')}>
              {activeTab === 'renting' ? 'Browse Items' : 'List an Item'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental) => (
              <div
                key={rental._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/rentals/${rental._id}`)}
              >
                <div className="flex gap-6">
                  {/* Item Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={rental.item.images[0] || '/placeholder.jpg'}
                      alt={rental.item.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Rental Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                          {rental.item.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activeTab === 'renting' ? (
                            <>Lent by {rental.owner.name}</>
                          ) : (
                            <>Rented by {rental.renter.name}</>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.rentalStatus)}`}>
                          {rental.rentalStatus.charAt(0).toUpperCase() + rental.rentalStatus.slice(1)}
                        </span>
                        <span className={`text-sm font-medium ${getPaymentStatusColor(rental.paymentStatus)}`}>
                          {rental.paymentStatus.charAt(0).toUpperCase() + rental.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{calculateDays(rental.startDate, rental.endDate)} days</span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Total Amount</span>
                          <p className="text-lg font-semibold text-gray-900">${rental.totalAmount}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="block">Security Deposit</span>
                          <span className="font-medium text-gray-700">${rental.securityDeposit}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
