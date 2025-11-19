import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check existing users
    const existingCount = await UserModel.countDocuments()
    console.log(`Found ${existingCount} existing users`)

    // Create dummy users with hashed passwords
    const dummyUsers = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=1',
        location: {
          address: 'San Francisco, CA',
          coordinates: [-122.4194, 37.7749]
        },
        phone: '+1-415-555-0101',
        verified: true,
        rating: 4.8,
        totalRatings: 12
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=2',
        location: {
          address: 'Oakland, CA',
          coordinates: [-122.2711, 37.8044]
        },
        phone: '+1-510-555-0102',
        verified: true,
        rating: 4.9,
        totalRatings: 18
      },
      {
        name: 'Mike Davis',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=3',
        location: {
          address: 'San Jose, CA',
          coordinates: [-121.8863, 37.3382]
        },
        phone: '+1-408-555-0103',
        verified: true,
        rating: 4.7,
        totalRatings: 15
      },
      {
        name: 'Emily Chen',
        email: 'emily@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=4',
        location: {
          address: 'Berkeley, CA',
          coordinates: [-122.2585, 37.8715]
        },
        phone: '+1-510-555-0104',
        verified: true,
        rating: 5.0,
        totalRatings: 20
      },
      {
        name: 'David Martinez',
        email: 'david@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=5',
        location: {
          address: 'Palo Alto, CA',
          coordinates: [-122.1430, 37.4419]
        },
        phone: '+1-650-555-0105',
        verified: true,
        rating: 4.6,
        totalRatings: 10
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=6',
        location: {
          address: 'Fremont, CA',
          coordinates: [-121.9886, 37.5485]
        },
        phone: '+1-510-555-0106',
        verified: true,
        rating: 4.8,
        totalRatings: 14
      },
      {
        name: 'James Wilson',
        email: 'james@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=7',
        location: {
          address: 'Richmond, CA',
          coordinates: [-122.3477, 37.9358]
        },
        phone: '+1-510-555-0107',
        verified: false,
        rating: 4.5,
        totalRatings: 8
      },
      {
        name: 'Maria Garcia',
        email: 'maria@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=8',
        location: {
          address: 'Sunnyvale, CA',
          coordinates: [-122.0364, 37.3688]
        },
        phone: '+1-408-555-0108',
        verified: true,
        rating: 4.9,
        totalRatings: 16
      },
      {
        name: 'Robert Taylor',
        email: 'robert@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=9',
        location: {
          address: 'Hayward, CA',
          coordinates: [-122.0808, 37.6688]
        },
        phone: '+1-510-555-0109',
        verified: true,
        rating: 4.7,
        totalRatings: 11
      },
      {
        name: 'Jennifer Brown',
        email: 'jennifer@example.com',
        password: await bcrypt.hash('password123', 10),
        image: 'https://i.pravatar.cc/150?img=10',
        location: {
          address: 'Mountain View, CA',
          coordinates: [-122.0838, 37.3861]
        },
        phone: '+1-650-555-0110',
        verified: true,
        rating: 5.0,
        totalRatings: 22
      }
    ]

    // Only create users that don't exist
    const createdUsers = []
    for (const userData of dummyUsers) {
      const existingUser = await UserModel.findOne({ email: userData.email })
      if (!existingUser) {
        const user = await UserModel.create(userData)
        createdUsers.push(user)
      }
    }

    const totalUsers = await UserModel.countDocuments()

    return NextResponse.json({
      success: true,
      message: 'Dummy users created successfully!',
      data: {
        newUsers: createdUsers.length,
        totalUsers: totalUsers,
        existingBefore: existingCount
      }
    })

  } catch (error) {
    console.error('Error creating dummy users:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create dummy users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
