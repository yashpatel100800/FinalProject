'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

const categories = [
  'Electronics',
  'Tools & Equipment',
  'Sports & Recreation',
  'Home & Garden',
  'Automotive',
  'Books & Media',
  'Clothing & Accessories',
  'Party & Events',
  'Baby & Kids',
  'Other'
]

const conditions = [
  { value: 'excellent', label: 'Excellent - Like new' },
  { value: 'good', label: 'Good - Minor wear' },
  { value: 'fair', label: 'Fair - Shows use' },
  { value: 'poor', label: 'Poor - Functional but worn' }
]

export default function NewItemPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<number[]>([-122.4194, 37.7749])
  const addressInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    pricePerDay: '',
    securityDeposit: '',
    condition: 'good',
    address: '',
    tags: ''
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || 
          !formData.pricePerDay || !formData.securityDeposit || !formData.address) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Convert comma-separated tags to array
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      // Use uploaded images or placeholder
      let imagesArray: string[] = []
      if (imagePreviews.length > 0) {
        imagesArray = imagePreviews
      } else {
        // Default placeholder image
        imagesArray = ['https://images.unsplash.com/photo-1560440021-33f9b867899d?w=500']
      }

      const itemData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        pricePerDay: parseFloat(formData.pricePerDay),
        securityDeposit: parseFloat(formData.securityDeposit),
        condition: formData.condition,
        address: formData.address,
        images: imagesArray,
        tags: tagsArray,
        // Use selected coordinates from Mapbox geocoding
        coordinates: selectedCoordinates
      }

      const response = await fetch('/api/items/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData)
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to items page or item detail page
        router.push('/items')
      } else {
        setError(data.message || 'Failed to create item')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Fetch address suggestions from Mapbox Geocoding API
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoieWFzaHBhdGVsMjAyNSIsImEiOiJjbThxaG4xNWwwbG11MmtzMXUzNHU2Y3lmIn0.ZXh5IgL8KnBpuHZLN8H8bQ'
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&country=US&types=address,place&limit=5`
      )
      
      const data = await response.json()
      
      if (data.features) {
        setAddressSuggestions(data.features)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
    }
  }

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({
      ...formData,
      address: value
    })
    fetchAddressSuggestions(value)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    setFormData({
      ...formData,
      address: suggestion.place_name
    })
    setSelectedCoordinates(suggestion.center)
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 5MB`)
        return false
      }
      return true
    })

    // Combine with existing files (max 5 images)
    const allFiles = [...imageFiles, ...validFiles].slice(0, 5)
    setImageFiles(allFiles)

    // Create previews
    const previews: string[] = []
    allFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === allFiles.length) {
          setImagePreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove image
  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List a New Item</h1>
          <p className="mt-2 text-gray-600">Share your items with the community and earn extra income</p>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Item Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Canon DSLR Camera, Power Drill, Mountain Bike"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                required
                maxLength={2000}
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item, its condition, what's included, and any special instructions..."
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory (Optional)
                </label>
                <Input
                  id="subcategory"
                  name="subcategory"
                  type="text"
                  value={formData.subcategory}
                  onChange={handleChange}
                  placeholder="e.g., DSLR, Power Tools"
                  className="w-full"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Day ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  placeholder="25.00"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="securityDeposit"
                  name="securityDeposit"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  placeholder="100.00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Item Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="condition"
                name="condition"
                required
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="relative">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={addressInputRef}
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleAddressChange}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder="Start typing an address..."
                  className="w-full pl-10"
                  autoComplete="off"
                />
              </div>
              
              {/* Address Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id || index}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.place_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="mt-1 text-sm text-gray-500">
                Enter the address where renters can pick up the item
              </p>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Images (Max 5)
              </label>
              <div className="space-y-4">
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {imagePreviews.length < 5 && (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB each)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Upload up to 5 images of your item. First image will be the main photo.
              </p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <Input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                placeholder="photography, professional, camera, canon"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add tags separated by commas to help others find your item
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'List Item'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
      </div>
    </Layout>
  )
}
