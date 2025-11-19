'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import Layout from '@/components/layout/Layout'
import { Card } from '@/components/ui/card'
import CheckoutForm from '@/components/payments/CheckoutForm'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const itemId = searchParams.get('itemId')
  const rentalDays = parseInt(searchParams.get('days') || '1')
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && itemId) {
      createPaymentIntent()
    }
  }, [status, itemId])

  const createPaymentIntent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          rentalDays,
          startDate,
          endDate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setClientSecret(data.clientSecret)
        setPaymentDetails(data)
      } else {
        setError(data.message || 'Failed to create payment intent')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Preparing checkout...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 max-w-md">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Go Back
              </button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
            <p className="mt-2 text-gray-600">
              Secure payment powered by Stripe
            </p>
          </div>

          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                paymentDetails={paymentDetails}
                itemId={itemId || ''}
                rentalDays={rentalDays}
                startDate={startDate}
                endDate={endDate}
              />
            </Elements>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">Loading checkout...</div>
          </div>
        </div>
      </Layout>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
