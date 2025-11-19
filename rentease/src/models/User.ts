import mongoose, { Schema, model, models } from 'mongoose'

interface IUser {
  email: string;
  name: string;
  password?: string;
  image?: string;
  location?: {
    address: string;
    coordinates: [number, number];
  };
  isVerified: boolean;
  rating: number;
  totalRatings: number;
  bio?: string;
  phone?: string;
  provider?: string;
  providerId?: string;
  joinedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't include password in queries by default
  },
  image: {
    type: String,
  },
  location: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
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
  bio: {
    type: String,
    maxlength: 500,
  },
  phone: {
    type: String,
  },
  provider: {
    type: String,
    enum: ['credentials', 'google', 'facebook', 'apple'],
    default: 'credentials',
  },
  providerId: {
    type: String,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
userSchema.index({ 'location.coordinates': '2dsphere' })
userSchema.index({ rating: -1 })

// Virtual for full location
userSchema.virtual('fullLocation').get(function(this: IUser) {
  if (this.location?.address && this.location?.coordinates) {
    return {
      address: this.location.address,
      coordinates: this.location.coordinates,
    }
  }
  return null
})

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true })

const UserModel = models.User || model<IUser>('User', userSchema)

export default UserModel