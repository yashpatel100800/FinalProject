export interface User {
  _id: string;
  email: string;
  name: string;
  image?: string;
  location?: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  isVerified: boolean;
  rating: number;
  totalRatings: number;
  joinedAt: Date;
  bio?: string;
  phone?: string;
}

export interface Item {
  _id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  pricePerDay: number;
  securityDeposit: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  availability: {
    startDate: Date;
    endDate: Date;
    isAvailable: boolean;
  }[];
  location: {
    address: string;
    coordinates: [number, number];
  };
  owner: string; // User ID
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  totalRatings: number;
  isActive: boolean;
}

export interface Rental {
  _id: string;
  item: string; // Item ID
  renter: string; // User ID
  owner: string; // User ID
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  securityDeposit: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'disputed';
  rentalStatus: 'requested' | 'approved' | 'active' | 'completed' | 'cancelled';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  _id: string;
  user: string; // User ID
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  maxBudgetPerDay: number;
  location: {
    address: string;
    coordinates: [number, number];
    radius: number; // in kilometers
  };
  requiredDates: {
    startDate: Date;
    endDate: Date;
  };
  tags: string[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string; // User ID
  receiver: string; // User ID
  content: string;
  messageType: 'text' | 'image' | 'system';
  relatedItem?: string; // Item ID
  relatedRental?: string; // Rental ID
  isRead: boolean;
  createdAt: Date;
}

export interface Review {
  _id: string;
  reviewer: string; // User ID
  reviewee: string; // User ID
  item?: string; // Item ID
  rental: string; // Rental ID
  rating: number;
  comment: string;
  images?: string[];
  reviewType: 'item' | 'user';
  createdAt: Date;
}

export interface Conversation {
  _id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  item?: string; // Item ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth related types
export interface AuthUser extends User {
  accessToken?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: {
    coordinates: [number, number];
    radius: number;
  };
  startDate?: Date;
  endDate?: Date;
  condition?: string[];
  sortBy?: 'price' | 'rating' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

// Component prop types
export interface ItemCardProps {
  item: Item;
  showActions?: boolean;
  onClick?: () => void;
}

export interface UserProfileProps {
  user: User;
  isOwner?: boolean;
  onEdit?: () => void;
}

// Form types
export interface ItemFormData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  pricePerDay: number;
  securityDeposit: number;
  condition: string;
  tags: string[];
  images: File[] | string[];
  location: {
    address: string;
    coordinates: [number, number];
  };
}

export interface RequestFormData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  maxBudgetPerDay: number;
  location: {
    address: string;
    coordinates: [number, number];
    radius: number;
  };
  requiredDates: {
    startDate: Date;
    endDate: Date;
  };
  tags: string[];
}

// Categories and constants
export const ITEM_CATEGORIES = [
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
] as const;

export const ITEM_CONDITIONS = [
  'excellent',
  'good', 
  'fair',
  'poor'
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
export type ItemCondition = typeof ITEM_CONDITIONS[number];