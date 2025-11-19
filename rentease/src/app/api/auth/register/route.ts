import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone, address, password } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !address) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim()

    // Create new user
    const user = new UserModel({
      name: fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      location: {
        address: address,
      },
      isVerified: false, // Email verification can be added later
      joinedAt: new Date(),
    })

    await user.save()

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      isVerified: user.isVerified,
      joinedAt: user.joinedAt,
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}