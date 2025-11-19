'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/layout/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [rentalId, setRentalId] = useState('')

  const paymentIntent = searchParams.get('payment_intent')
  const itemId = searchParams.get('itemId')
  const days = searchParams.get('days')

  useEffect(() => {
    if (paymentIntent) {
      verifyPayment()
    }
  }, [paymentIntent])

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent,
        }),
      })

      const data = await response.json()

      if (data.success && data.rental) {
        setStatus('success')
        setRentalId(data.rental._id)
        setMessage('Payment successful! Your rental request has been created.')
      } else {
        setStatus('error')
        setMessage(data.message || 'Payment verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to verify payment')
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            {status === 'success' ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h1>
                
                <p className="text-gray-600 mb-8">
                  {message}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h2 className="font-semibold text-gray-900 mb-2">What's Next?</h2>
                  <ul className="text-sm text-gray-600 space-y-2 text-left">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>The item owner will review your rental request</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>You'll receive a notification when they approve</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Coordinate pickup details with the owner</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>Your security deposit will be refunded after return</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push(`/rentals/${rentalId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Rental Details
                  </Button>
                  <Button
                    onClick={() => router.push('/rentals')}
                    variant="outline"
                  >
                    My Rentals
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Payment Failed
                </h1>
                
                <p className="text-gray-600 mb-8">
                  {message}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push(`/items/${itemId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                  >
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
