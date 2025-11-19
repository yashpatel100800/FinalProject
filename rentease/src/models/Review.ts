import mongoose, { Schema, model, models } from 'mongoose'

interface IReview {
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  item?: mongoose.Types.ObjectId;
  rental: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  reviewType: 'item' | 'user';
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
  },
  rental: {
    type: Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  images: [{
    type: String,
  }],
  reviewType: {
    type: String,
    enum: ['item', 'user'],
    required: true,
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
reviewSchema.index({ reviewer: 1 })
reviewSchema.index({ reviewee: 1 })
reviewSchema.index({ item: 1 })
reviewSchema.index({ rental: 1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ reviewType: 1 })
reviewSchema.index({ createdAt: -1 })

// Ensure one review per rental per reviewer
reviewSchema.index({ reviewer: 1, rental: 1 }, { unique: true })

const ReviewModel = models.Review || model<IReview>('Review', reviewSchema)

export default ReviewModel