'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CATEGORIES = [
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

export default function NewRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    maxBudgetPerDay: '',
    location: {
      address: '',
      radius: '10'
    },
    requiredDates: {
      startDate: '',
      endDate: ''
    },
    tags: '',
    expiresAt: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          maxBudgetPerDay: parseFloat(formData.maxBudgetPerDay),
          location: {
            ...formData.location,
            radius: parseInt(formData.location.radius)
          },
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/requests')
      } else {
        alert(data.message || 'Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Request</h1>
          <p className="text-gray-600 mt-2">Looking for something? Let the community know what you need!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What are you looking for?</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Need DSLR Camera for Wedding"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Describe what you're looking for, including any specific requirements..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    type="text"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., DSLR Camera"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget</h2>
            
            <div>
              <Label htmlFor="maxBudgetPerDay">Maximum Budget Per Day *</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  id="maxBudgetPerDay"
                  name="maxBudgetPerDay"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.maxBudgetPerDay}
                  onChange={handleInputChange}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">The maximum you're willing to pay per day</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="location.address">Your Location *</Label>
                <Input
                  id="location.address"
                  name="location.address"
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="e.g., San Francisco, CA"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location.radius">Search Radius (miles) *</Label>
                <select
                  id="location.radius"
                  name="location.radius"
                  required
                  value={formData.location.radius}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="20">20 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Dates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requiredDates.startDate">Start Date *</Label>
                <Input
                  id="requiredDates.startDate"
                  name="requiredDates.startDate"
                  type="date"
                  required
                  value={formData.requiredDates.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="requiredDates.endDate">End Date *</Label>
                <Input
                  id="requiredDates.endDate"
                  name="requiredDates.endDate"
                  type="date"
                  required
                  value={formData.requiredDates.endDate}
                  onChange={handleInputChange}
                  min={formData.requiredDates.startDate || new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., professional, wedding, photography (comma separated)"
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-gray-500">Add keywords to help people find your request</p>
              </div>

              <div>
                <Label htmlFor="expiresAt">Request Expires On</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-gray-500">When should this request automatically expire? (optional)</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/requests')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Request'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
