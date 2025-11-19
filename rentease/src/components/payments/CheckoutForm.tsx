'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, DollarSign, Shield } from 'lucide-react'

interface CheckoutFormProps {
  paymentDetails: {
    amount: number
    breakdown: {
      rentalCost: number
      securityDeposit: number
      totalAmount: number
    }
  }
  itemId: string
  rentalDays: number
  startDate: string
  endDate: string
}

export default function CheckoutForm({
  paymentDetails,
  itemId,
  rentalDays,
  startDate,
  endDate,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?itemId=${itemId}&days=${rentalDays}`,
      },
    })

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An error occurred')
      } else {
        setMessage('An unexpected error occurred.')
      }
    }

    setIsLoading(false)
  }

  const paymentElementOptions = {
    layout: 'tabs' as const,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Payment Form */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Payment Details</h2>
              <p className="text-sm text-gray-600">
                Enter your payment information below
              </p>
            </div>

            <PaymentElement
              id="payment-element"
              options={paymentElementOptions}
            />

            <div className="mt-6 space-y-4">
              {message && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay $${paymentDetails.amount.toFixed(2)}`
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Your payment is secure and encrypted. Security deposit will be refunded after return.
              </p>
            </div>
          </form>
        </Card>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-20">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-4">
            {/* Rental Period */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Rental Period</div>
                <div className="text-sm text-gray-600 mt-1">
                  {rentalDays} day{rentalDays > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rental Cost</span>
                <span className="text-sm font-medium">
                  ${paymentDetails.breakdown.rentalCost.toFixed(2)}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Security Deposit</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Refundable
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  ${paymentDetails.breakdown.securityDeposit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-semibold text-gray-900">Total Due</span>
              <span className="text-2xl font-bold text-blue-600">
                ${paymentDetails.breakdown.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Payment Icons */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" className="h-6" />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Powered by Stripe
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
