import mongoose, { Schema, model, models } from 'mongoose'

interface IRental {
  item: mongoose.Types.ObjectId;
  renter: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  securityDeposit: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'disputed';
  rentalStatus: 'requested' | 'approved' | 'active' | 'returned' | 'completed' | 'cancelled';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rentalSchema = new Schema<IRental>({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  renter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IRental, value: Date) {
        return value > this.startDate
      },
      message: 'End date must be after start date'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'disputed'],
    default: 'pending',
  },
  rentalStatus: {
    type: String,
    enum: ['requested', 'approved', 'active', 'returned', 'completed', 'cancelled'],
    default: 'requested',
  },
  stripePaymentIntentId: {
    type: String,
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
rentalSchema.index({ item: 1 })
rentalSchema.index({ renter: 1 })
rentalSchema.index({ owner: 1 })
rentalSchema.index({ startDate: 1, endDate: 1 })
rentalSchema.index({ paymentStatus: 1 })
rentalSchema.index({ rentalStatus: 1 })
rentalSchema.index({ createdAt: -1 })

// Virtual for rental duration in days
rentalSchema.virtual('durationDays').get(function(this: IRental) {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Ensure virtual fields are serialized
rentalSchema.set('toJSON', { virtuals: true })

const RentalModel = models.Rental || model<IRental>('Rental', rentalSchema)

export default RentalModel