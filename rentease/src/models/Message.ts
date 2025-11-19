import mongoose, { Schema, model, models } from 'mongoose'

interface IMessage {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'system';
  relatedItem?: mongoose.Types.ObjectId;
  relatedRental?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

interface IConversation {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  item?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text',
  },
  relatedItem: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
  },
  relatedRental: {
    type: Schema.Types.ObjectId,
    ref: 'Rental',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })
messageSchema.index({ receiver: 1 })
messageSchema.index({ isRead: 1 })
messageSchema.index({ createdAt: -1 })

conversationSchema.index({ participants: 1 })
conversationSchema.index({ item: 1 })
conversationSchema.index({ updatedAt: -1 })
conversationSchema.index({ isActive: 1 })

// Ensure unique conversations between participants for same item
conversationSchema.index({ participants: 1, item: 1 }, { unique: true })

const MessageModel = models.Message || model<IMessage>('Message', messageSchema)
const ConversationModel = models.Conversation || model<IConversation>('Conversation', conversationSchema)

export { MessageModel, ConversationModel }