import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { MessageModel, ConversationModel } from '@/models/Message'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id

    // Verify user is part of the conversation
    const conversation = await ConversationModel.findOne({
      _id: id,
      participants: userId,
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get all messages in the conversation
    const messages = await MessageModel.find({
      conversationId: id,
    })
      .populate('sender', 'name email image')
      .populate('receiver', 'name email image')
      .sort({ createdAt: 1 })

    // Mark messages as read
    await MessageModel.updateMany(
      {
        conversationId: id,
        receiver: userId,
        isRead: false,
      },
      { isRead: true }
    )

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content, messageType = 'text' } = body
    const userId = (session.user as any).id

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message content required' },
        { status: 400 }
      )
    }

    // Verify user is part of the conversation
    const conversation = await ConversationModel.findOne({
      _id: id,
      participants: userId,
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get receiver (other participant)
    const receiverId = conversation.participants.find(
      (p: any) => p.toString() !== userId
    )

    // Create message
    const message = await MessageModel.create({
      conversationId: id,
      sender: userId,
      receiver: receiverId,
      content: content.trim(),
      messageType,
      isRead: false,
    })

    // Update conversation's last message
    conversation.lastMessage = message._id as any
    await conversation.save()

    await message.populate('sender', 'name email image')
    await message.populate('receiver', 'name email image')

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
