import mongoose, { Schema, model, models } from 'mongoose'

interface IRequest {
  user: mongoose.Types.ObjectId;
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
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
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
  maxBudgetPerDay: {
    type: Number,
    required: true,
    min: 0,
  },
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
    radius: {
      type: Number,
      required: true,
      min: 1,
      max: 100, // Max 100km radius
      default: 10,
    },
  },
  requiredDates: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: IRequest, value: Date) {
          return value > this.requiredDates.startDate
        },
        message: 'End date must be after start date'
      }
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
requestSchema.index({ user: 1 })
requestSchema.index({ category: 1 })
requestSchema.index({ 'location.coordinates': '2dsphere' })
requestSchema.index({ maxBudgetPerDay: 1 })
requestSchema.index({ 'requiredDates.startDate': 1, 'requiredDates.endDate': 1 })
requestSchema.index({ isActive: 1 })
requestSchema.index({ expiresAt: 1 })
requestSchema.index({ createdAt: -1 })
requestSchema.index({ tags: 1 })

// Text index for search
requestSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
})

// TTL index to automatically delete expired requests
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Virtual for days until expiry
requestSchema.virtual('daysUntilExpiry').get(function(this: IRequest) {
  const now = new Date()
  const diffTime = this.expiresAt.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

// Ensure virtual fields are serialized
requestSchema.set('toJSON', { virtuals: true })

const RequestModel = models.Request || model<IRequest>('Request', requestSchema)

export default RequestModel