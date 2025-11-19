import { z } from 'zod'

// User validation schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
  }).optional(),
})

// Item validation schemas
export const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.enum([
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
  ]),
  subcategory: z.string().max(50, 'Subcategory must be less than 50 characters').optional(),
  pricePerDay: z.number().min(0.01, 'Price must be at least $0.01').max(10000, 'Price must be less than $10,000'),
  securityDeposit: z.number().min(0, 'Security deposit cannot be negative').max(50000, 'Security deposit must be less than $50,000'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  tags: z.array(z.string().max(30, 'Tag must be less than 30 characters')).max(10, 'Maximum 10 tags allowed'),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
  }),
  availability: z.array(z.object({
    startDate: z.date(),
    endDate: z.date(),
    isAvailable: z.boolean().default(true),
  })).min(1, 'At least one availability period is required'),
})

// Request validation schemas
export const requestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.enum([
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
  ]),
  subcategory: z.string().max(50, 'Subcategory must be less than 50 characters').optional(),
  maxBudgetPerDay: z.number().min(0.01, 'Budget must be at least $0.01').max(10000, 'Budget must be less than $10,000'),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
    radius: z.number().min(1, 'Radius must be at least 1km').max(100, 'Radius must be less than 100km'),
  }),
  requiredDates: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).refine(data => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
  tags: z.array(z.string().max(30, 'Tag must be less than 30 characters')).max(10, 'Maximum 10 tags allowed'),
})

// Rental validation schemas
export const rentalSchema = z.object({
  item: z.string().min(1, 'Item ID is required'),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// Review validation schemas
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters'),
  reviewType: z.enum(['item', 'user']),
  images: z.array(z.string()).max(5, 'Maximum 5 images allowed').optional(),
})

// Message validation schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message must be less than 2000 characters'),
  messageType: z.enum(['text', 'image', 'system']).default('text'),
  relatedItem: z.string().optional(),
  relatedRental: z.string().optional(),
})

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.number().min(0, 'Minimum price cannot be negative').optional(),
  maxPrice: z.number().min(0, 'Maximum price cannot be negative').optional(),
  location: z.object({
    coordinates: z.array(z.number()).length(2),
    radius: z.number().min(1).max(100),
  }).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  condition: z.array(z.enum(['excellent', 'good', 'fair', 'poor'])).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'newest']).default('newest'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine(data => {
  if (data.minPrice && data.maxPrice) {
    return data.maxPrice >= data.minPrice
  }
  return true
}, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['maxPrice'],
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type ItemInput = z.infer<typeof itemSchema>
export type RequestInput = z.infer<typeof requestSchema>
export type RentalInput = z.infer<typeof rentalSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type SearchInput = z.infer<typeof searchSchema>