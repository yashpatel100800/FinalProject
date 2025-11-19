import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { MessageModel, ConversationModel } from '@/models/Message'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // Get all conversations for the user
    const conversations = await ConversationModel.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'name email image')
      .populate('lastMessage')
      .populate('item', 'title images')
      .sort({ updatedAt: -1 })

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await MessageModel.countDocuments({
          conversationId: conv._id,
          receiver: userId,
          isRead: false,
        })

        return {
          ...conv.toObject(),
          unreadCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: conversationsWithUnread,
    })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { participantId, itemId } = body
    const userId = (session.user as any).id

    if (!participantId) {
      return NextResponse.json(
        { success: false, message: 'Participant ID required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await ConversationModel.findOne({
      participants: { $all: [userId, participantId] },
      item: itemId || null,
    })

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: [userId, participantId],
        item: itemId || undefined,
        isActive: true,
      })
    }

    await conversation.populate('participants', 'name email image')
    await conversation.populate('item', 'title images')

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
