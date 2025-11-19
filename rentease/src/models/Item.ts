import mongoose, { Schema, model, models } from 'mongoose'

interface IItem {
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
  owner: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  totalRatings: number;
  isActive: boolean;
}

const itemSchema = new Schema<IItem>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  images: [{
    type: String,
    required: true,
  }],
  category: {
    type: String,
    required: true,
    enum: [
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
    ],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0,
  },
  condition: {
    type: String,
    required: true,
    enum: ['excellent', 'good', 'fair', 'poor'],
  },
  availability: [{
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
  location: {
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere',
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
itemSchema.index({ category: 1 })
itemSchema.index({ 'location.coordinates': '2dsphere' })
itemSchema.index({ pricePerDay: 1 })
itemSchema.index({ rating: -1 })
itemSchema.index({ createdAt: -1 })
itemSchema.index({ owner: 1 })
itemSchema.index({ tags: 1 })

// Text index for search
itemSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
})

const ItemModel = models.Item || model<IItem>('Item', itemSchema)

export default ItemModel