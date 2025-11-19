import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import ItemModel from '@/models/Item'
import RequestModel from '@/models/Request'
import RentalModel from '@/models/Rental'
import ReviewModel from '@/models/Review'
import { MessageModel } from '@/models/Message'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Define conversation schema once
    const conversationSchema = new mongoose.Schema({
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true })
    const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)

    // Clear existing data to avoid duplicates
    await ItemModel.deleteMany({})
    await RequestModel.deleteMany({})
    await RentalModel.deleteMany({})
    await ReviewModel.deleteMany({})
    await MessageModel.deleteMany({})
    await ConversationModel.deleteMany({})

    // Get existing users to reference
    const users = await UserModel.find().limit(10)
    if (users.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Need at least 3 users. Please create more users first.'
      }, { status: 400 })
    }

    const userIds = users.map(user => user._id)
    
    // Helper function to get a random user different from owner
    const getRandomRenter = (ownerId: mongoose.Types.ObjectId) => {
      const availableUsers = userIds.filter(id => !id.equals(ownerId))
      return availableUsers[Math.floor(Math.random() * availableUsers.length)]
    }

    // Sample item data
    const itemsData = [
      {
        title: "Canon EOS R5 Camera",
        description: "Professional mirrorless camera with 45MP sensor. Perfect for photography enthusiasts and professionals. Includes battery, charger, and camera strap. Great condition with minimal wear.",
        images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500"],
        category: "Electronics",
        subcategory: "Cameras",
        pricePerDay: 45,
        securityDeposit: 800,
        condition: "excellent",
        availability: [
          {
            startDate: new Date('2025-09-25'),
            endDate: new Date('2025-12-31'),
            isAvailable: true
          }
        ],
        location: {
          address: "123 Tech Street, San Francisco, CA 94102",
          coordinates: [-122.4194, 37.7749]
        },
        tags: ["photography", "professional", "mirrorless", "canon"],
        rating: 4.8,
        totalRatings: 15
      },
      {
        title: "DeWalt Cordless Drill Set",
        description: "Heavy-duty cordless drill with multiple bits and case. 20V battery included. Perfect for home improvement projects, furniture assembly, and repairs.",
        images: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500"],
        category: "Tools & Equipment",
        subcategory: "Power Tools",
        pricePerDay: 15,
        securityDeposit: 150,
        condition: "good",
        availability: [
          {
            startDate: new Date('2025-09-24'),
            endDate: new Date('2025-11-30'),
            isAvailable: true
          }
        ],
        location: {
          address: "456 Workshop Ave, Oakland, CA 94601",
          coordinates: [-122.2711, 37.8044]
        },
        tags: ["drill", "power tool", "diy", "construction"],
        rating: 4.6,
        totalRatings: 8
      },
      {
        title: "Mountain Bike - Trek Fuel EX 8",
        description: "Full suspension mountain bike, perfect for trail riding. Well-maintained with recent tune-up. Includes helmet and water bottle holder.",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500", "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500"],
        category: "Sports & Recreation",
        subcategory: "Bicycles",
        pricePerDay: 25,
        securityDeposit: 400,
        condition: "good",
        availability: [
          {
            startDate: new Date('2025-09-26'),
            endDate: new Date('2025-10-31'),
            isAvailable: true
          }
        ],
        location: {
          address: "789 Trail Road, Marin County, CA 94941",
          coordinates: [-122.5664, 37.9735]
        },
        tags: ["mountain bike", "cycling", "outdoor", "adventure"],
        rating: 4.9,
        totalRatings: 12
      },
      {
        title: "Weber Gas Grill",
        description: "Large propane gas grill perfect for backyard BBQs and parties. Includes grilling tools and propane tank. Seats up to 8 people comfortably.",
        images: ["https://images.unsplash.com/photo-1558030006-450675393462?w=500"],
        category: "Home & Garden",
        subcategory: "Outdoor Equipment",
        pricePerDay: 20,
        securityDeposit: 200,
        condition: "excellent",
        availability: [
          {
            startDate: new Date('2025-09-23'),
            endDate: new Date('2025-12-15'),
            isAvailable: true
          }
        ],
        location: {
          address: "321 Garden Way, Palo Alto, CA 94301",
          coordinates: [-122.1430, 37.4419]
        },
        tags: ["grill", "bbq", "outdoor", "party"],
        rating: 4.7,
        totalRatings: 6
      },
      {
        title: "Nintendo Switch Console",
        description: "Gaming console with multiple games included: Mario Kart 8, Super Mario Odyssey, and Zelda. Perfect for family game nights or solo gaming.",
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500"],
        category: "Electronics",
        subcategory: "Gaming",
        pricePerDay: 12,
        securityDeposit: 350,
        condition: "excellent",
        availability: [
          {
            startDate: new Date('2025-09-28'),
            endDate: new Date('2025-11-20'),
            isAvailable: true
          }
        ],
        location: {
          address: "654 Gaming Street, San Jose, CA 95110",
          coordinates: [-121.8863, 37.3382]
        },
        tags: ["gaming", "nintendo", "family", "entertainment"],
        rating: 4.5,
        totalRatings: 10
      },
      {
        title: "Pressure Washer - 3000 PSI",
        description: "High-pressure washer for cleaning driveways, decks, and outdoor surfaces. Includes various nozzle attachments and cleaning solution.",
        images: ["https://images.unsplash.com/photo-1558618047-3c0c8c1dd47b?w=500"],
        category: "Tools & Equipment",
        subcategory: "Cleaning Equipment",
        pricePerDay: 18,
        securityDeposit: 180,
        condition: "good",
        availability: [
          {
            startDate: new Date('2025-09-24'),
            endDate: new Date('2025-12-01'),
            isAvailable: true
          }
        ],
        location: {
          address: "987 Clean Avenue, Fremont, CA 94536",
          coordinates: [-121.9886, 37.5485]
        },
        tags: ["pressure washer", "cleaning", "outdoor", "maintenance"],
        rating: 4.4,
        totalRatings: 7
      },
      {
        title: "Kayak - Single Person",
        description: "Lightweight recreational kayak perfect for lakes and calm rivers. Includes paddle, life jacket, and waterproof storage bag.",
        images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500"],
        category: "Sports & Recreation",
        subcategory: "Water Sports",
        pricePerDay: 22,
        securityDeposit: 300,
        condition: "good",
        availability: [
          {
            startDate: new Date('2025-09-25'),
            endDate: new Date('2025-10-25'),
            isAvailable: true
          }
        ],
        location: {
          address: "147 Lake Shore Drive, Richmond, CA 94801",
          coordinates: [-122.3477, 37.9358]
        },
        tags: ["kayak", "water sports", "outdoor", "recreation"],
        rating: 4.6,
        totalRatings: 9
      },
      {
        title: "Party Tent 10x20ft",
        description: "Large white party tent perfect for outdoor events, weddings, and gatherings. Includes stakes and setup instructions. Weather resistant.",
        images: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500"],
        category: "Party & Events",
        subcategory: "Outdoor Setup",
        pricePerDay: 35,
        securityDeposit: 250,
        condition: "excellent",
        availability: [
          {
            startDate: new Date('2025-09-26'),
            endDate: new Date('2025-11-15'),
            isAvailable: true
          }
        ],
        location: {
          address: "258 Event Plaza, Berkeley, CA 94704",
          coordinates: [-122.2585, 37.8715]
        },
        tags: ["tent", "party", "wedding", "outdoor event"],
        rating: 4.8,
        totalRatings: 5
      }
    ]

    // Create items with random owners
    const createdItems = []
    for (const itemData of itemsData) {
      const randomOwner = userIds[Math.floor(Math.random() * userIds.length)]
      const item = new ItemModel({
        ...itemData,
        owner: randomOwner,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      })
      const savedItem = await item.save()
      createdItems.push(savedItem)
    }

    // Sample requests data with current/future dates
    const requestsData = [
      {
        title: "Need DSLR Camera for Wedding",
        description: "Looking for a professional camera for a family wedding next weekend. Preferably Canon or Nikon with good low-light performance.",
        category: "Electronics",
        subcategory: "Cameras",
        maxBudgetPerDay: 40,
        location: {
          address: "Downtown San Francisco, CA",
          coordinates: [-122.4194, 37.7749],
          radius: 15
        },
        requiredDates: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) // 9 days from now
        },
        tags: ["camera", "wedding", "photography", "professional"],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: "Power Tools for Deck Building",
        description: "Need circular saw, drill, and other power tools for a weekend deck building project. Must be in good working condition.",
        category: "Tools & Equipment",
        subcategory: "Power Tools",
        maxBudgetPerDay: 30,
        location: {
          address: "Oakland Hills, CA",
          coordinates: [-122.2711, 37.8044],
          radius: 20
        },
        requiredDates: {
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000) // 16 days from now
        },
        tags: ["power tools", "construction", "deck", "weekend project"],
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
      },
      {
        title: "Camping Gear for Family Trip",
        description: "Looking for camping equipment for family of 4. Need tent, sleeping bags, and camping stove for Yosemite trip.",
        category: "Sports & Recreation",
        subcategory: "Camping",
        maxBudgetPerDay: 25,
        location: {
          address: "San Jose, CA",
          coordinates: [-121.8863, 37.3382],
          radius: 25
        },
        requiredDates: {
          startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000) // 24 days from now
        },
        tags: ["camping", "family", "yosemite", "outdoor"],
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        title: "Party Tent for Birthday",
        description: "Need a large party tent for outdoor birthday party. Looking for 10x20 or larger that can fit 30-40 people.",
        category: "Party & Events",
        subcategory: "Outdoor Setup",
        maxBudgetPerDay: 40,
        location: {
          address: "Berkeley, CA",
          coordinates: [-122.2585, 37.8715],
          radius: 10
        },
        requiredDates: {
          startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000) // 11 days from now
        },
        tags: ["party", "tent", "birthday", "outdoor"],
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
      },
      {
        title: "Mountain Bike for Weekend Trail",
        description: "Looking for a full suspension mountain bike for weekend trail riding. Must be in good condition with working brakes.",
        category: "Sports & Recreation",
        subcategory: "Bicycles",
        maxBudgetPerDay: 30,
        location: {
          address: "Marin County, CA",
          coordinates: [-122.5664, 37.9735],
          radius: 15
        },
        requiredDates: {
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        },
        tags: ["mountain bike", "cycling", "trails", "weekend"],
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
      }
    ]

    // Create requests with random users
    const createdRequests = []
    for (const requestData of requestsData) {
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)]
      const request = new RequestModel({
        ...requestData,
        user: randomUser,
        createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000) // Random date in last 15 days
      })
      const savedRequest = await request.save()
      createdRequests.push(savedRequest)
    }

    // Create comprehensive rental transactions
    const rentalsData = []
    
    // Helper function to calculate days
    const calculateDays = (start: Date, end: Date) => {
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }

    // COMPLETED RENTALS (Past transactions with payment history)
    // Rental 1: Canon Camera - Completed 20 days ago
    const completedRental1 = {
      item: createdItems[0]._id, // Canon Camera
      renter: getRandomRenter(createdItems[0].owner),
      owner: createdItems[0].owner,
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[0].pricePerDay * 3, // 3 days
      securityDeposit: createdItems[0].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(completedRental1)

    // Rental 2: Drill Set - Completed 15 days ago
    const completedRental2 = {
      item: createdItems[1]._id, // DeWalt Drill
      renter: getRandomRenter(createdItems[1].owner),
      owner: createdItems[1].owner,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[1].pricePerDay * 2,
      securityDeposit: createdItems[1].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(completedRental2)

    // Rental 3: Mountain Bike - Completed 10 days ago
    const completedRental3 = {
      item: createdItems[2]._id, // Mountain Bike
      renter: getRandomRenter(createdItems[2].owner),
      owner: createdItems[2].owner,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[2].pricePerDay * 5,
      securityDeposit: createdItems[2].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(completedRental3)

    // Rental 4: Weber Grill - Completed 7 days ago
    const completedRental4 = {
      item: createdItems[3]._id, // Weber Grill
      renter: getRandomRenter(createdItems[3].owner),
      owner: createdItems[3].owner,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[3].pricePerDay * 1,
      securityDeposit: createdItems[3].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(completedRental4)

    // ACTIVE RENTALS (Currently ongoing)
    // Rental 5: Nintendo Switch - Currently active
    const activeRental1 = {
      item: createdItems[4]._id, // Nintendo Switch
      renter: getRandomRenter(createdItems[4].owner),
      owner: createdItems[4].owner,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[4].pricePerDay * 5,
      securityDeposit: createdItems[4].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'active' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(activeRental1)

    // Rental 6: Pressure Washer - Currently active
    const activeRental2 = {
      item: createdItems[5]._id, // Pressure Washer
      renter: getRandomRenter(createdItems[5].owner),
      owner: createdItems[5].owner,
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[5].pricePerDay * 3,
      securityDeposit: createdItems[5].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'active' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(activeRental2)

    // Rental 7: Kayak - Currently active
    const activeRental3 = {
      item: createdItems[6]._id, // Kayak
      renter: getRandomRenter(createdItems[6].owner),
      owner: createdItems[6].owner,
      startDate: new Date(Date.now()),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[6].pricePerDay * 4,
      securityDeposit: createdItems[6].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'active' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(activeRental3)

    // APPROVED/UPCOMING RENTALS (Scheduled for future)
    // Rental 8: Party Tent - Approved for next week
    const approvedRental1 = {
      item: createdItems[7]._id, // Party Tent
      renter: getRandomRenter(createdItems[7].owner),
      owner: createdItems[7].owner,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[7].pricePerDay * 2,
      securityDeposit: createdItems[7].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'approved' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(approvedRental1)

    // Rental 9: Canon Camera again - Approved for 2 weeks from now
    const approvedRental2 = {
      item: createdItems[0]._id, // Canon Camera
      renter: getRandomRenter(createdItems[0].owner),
      owner: createdItems[0].owner,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[0].pricePerDay * 2,
      securityDeposit: createdItems[0].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'approved' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(approvedRental2)

    // PENDING RENTALS (Payment not completed)
    // Rental 10: Mountain Bike - Requested but payment pending
    const pendingRental1 = {
      item: createdItems[2]._id, // Mountain Bike
      renter: getRandomRenter(createdItems[2].owner),
      owner: createdItems[2].owner,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[2].pricePerDay * 3,
      securityDeposit: createdItems[2].securityDeposit,
      paymentStatus: 'pending' as const,
      rentalStatus: 'requested' as const,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
    rentalsData.push(pendingRental1)

    // CANCELLED RENTAL (For transaction history)
    // Rental 11: Weber Grill - Cancelled by renter
    const cancelledRental1 = {
      item: createdItems[3]._id, // Weber Grill
      renter: getRandomRenter(createdItems[3].owner),
      owner: createdItems[3].owner,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[3].pricePerDay * 1,
      securityDeposit: createdItems[3].securityDeposit,
      paymentStatus: 'refunded' as const,
      rentalStatus: 'cancelled' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(cancelledRental1)

    // Add multiple rentals for same user to show rental history
    // User has rented multiple items
    const firstRenter = getRandomRenter(createdItems[5].owner)
    const userHistoryRental1 = {
      item: createdItems[5]._id, // Pressure Washer
      renter: firstRenter,
      owner: createdItems[5].owner,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[5].pricePerDay * 1,
      securityDeposit: createdItems[5].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(userHistoryRental1)

    const userHistoryRental2 = {
      item: createdItems[4]._id, // Nintendo Switch
      renter: firstRenter, // Same renter as previous rental
      owner: createdItems[4].owner,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
      totalAmount: createdItems[4].pricePerDay * 3,
      securityDeposit: createdItems[4].securityDeposit,
      paymentStatus: 'paid' as const,
      rentalStatus: 'completed' as const,
      stripePaymentIntentId: 'pi_test_' + Math.random().toString(36).substring(7),
      createdAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000)
    }
    rentalsData.push(userHistoryRental2)

    const createdRentals = await RentalModel.insertMany(rentalsData)

    // Create comprehensive reviews for completed rentals
    const reviewsData = []
    const completedRentals = createdRentals.filter(rental => rental.rentalStatus === 'completed')
    
    const renterComments = [
      "Excellent experience! The item was exactly as described and in perfect condition.",
      "Great communication from the owner. Item worked flawlessly. Highly recommend!",
      "Very smooth rental process. The owner was flexible with pickup and return times.",
      "Item exceeded my expectations. Owner provided clear instructions and was very helpful.",
      "Perfect for what I needed. Owner was responsive and professional throughout.",
      "Amazing rental experience! The item was clean and well-maintained.",
      "Couldn't be happier with this rental. Everything went smoothly from start to finish.",
      "The owner went above and beyond to ensure I had everything I needed. 5 stars!"
    ]

    const ownerComments = [
      "Fantastic renter! Took great care of the item and returned it on time.",
      "Very responsible and respectful renter. Would definitely rent to them again!",
      "Excellent communication. Item returned in perfect condition. Highly recommended renter!",
      "Trustworthy renter who followed all guidelines. A pleasure to work with!",
      "Returned the item early and in pristine condition. Couldn't ask for better!",
      "Professional and courteous renter. Made the entire process easy and stress-free.",
      "Great renter with excellent communication. Would rent to them anytime!",
      "Responsible and reliable. Item returned clean and in the same condition."
    ]
    
    for (let i = 0; i < completedRentals.length; i++) {
      const rental = completedRentals[i]
      
      // Renter reviews item and owner
      reviewsData.push({
        reviewer: rental.renter,
        reviewee: rental.owner,
        item: rental.item,
        rental: rental._id,
        rating: Math.random() > 0.3 ? 5 : 4, // 70% 5-star, 30% 4-star
        comment: renterComments[i % renterComments.length],
        reviewType: 'user'
      })
      
      // Owner reviews renter
      reviewsData.push({
        reviewer: rental.owner,
        reviewee: rental.renter,
        rental: rental._id,
        rating: Math.random() > 0.3 ? 5 : 4, // 70% 5-star, 30% 4-star
        comment: ownerComments[i % ownerComments.length],
        reviewType: 'user'
      })
    }

    // Insert reviews individually to handle duplicates
    const createdReviews = []
    for (const reviewData of reviewsData) {
      try {
        const review = await ReviewModel.create(reviewData)
        createdReviews.push(review)
      } catch (error) {
        // Skip duplicate reviews
        console.log('Skipping duplicate review')
      }
    }

    // Create conversations for active and upcoming rentals with comprehensive message history
    const conversationsData = []
    const messagesData = []

    // Get active and approved rentals for conversations
    const activeRentals = createdRentals.filter(rental => 
      rental.rentalStatus === 'active' || rental.rentalStatus === 'approved'
    )

    // Track combinations to avoid duplicates
    const conversationKeys = new Set<string>()

    for (let i = 0; i < Math.min(activeRentals.length, 5); i++) {
      const rental = activeRentals[i]
      const item = createdItems.find(item => item._id.equals(rental.item))
      
      if (!item) continue

      // Sort participants consistently to avoid duplicate key errors
      const participants = [rental.renter, rental.owner].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      )
      
      // Create unique key for this conversation
      const conversationKey = `${participants[0]}_${participants[1]}_${rental.item}`
      
      // Skip if this combination already exists
      if (conversationKeys.has(conversationKey)) {
        continue
      }
      conversationKeys.add(conversationKey)

      // Create conversation
      const conversation = new ConversationModel({
        participants,
        item: rental.item,
        isActive: true
      })
      
      try {
        const savedConversation = await conversation.save()
        conversationsData.push(savedConversation)

        // Create a realistic conversation thread
        const messages = [
          {
            conversationId: savedConversation._id,
            sender: rental.renter,
            receiver: rental.owner,
            content: `Hi! I'm interested in renting your ${item.title}. Is it available for the dates I'm looking at?`,
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 5 * 60 * 1000) // 5 minutes after rental created
          },
          {
            conversationId: savedConversation._id,
            sender: rental.owner,
            receiver: rental.renter,
            content: `Hello! Yes, it's available for those dates. The ${item.title} is in excellent condition and ready to go!`,
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 20 * 60 * 1000) // 20 minutes later
          },
          {
            conversationId: savedConversation._id,
            sender: rental.renter,
            receiver: rental.owner,
            content: "That's great! Can you tell me more about the condition and if there are any specific instructions I should know?",
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 25 * 60 * 1000)
          },
          {
            conversationId: savedConversation._id,
            sender: rental.owner,
            receiver: rental.renter,
            content: `It's been well-maintained and regularly serviced. I'll include all the necessary accessories and a quick guide. ${item.category === 'Electronics' ? 'Make sure to charge it fully before use.' : 'Please handle with care.'}`,
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 45 * 60 * 1000)
          },
          {
            conversationId: savedConversation._id,
            sender: rental.renter,
            receiver: rental.owner,
            content: "Perfect! What would be the best time and place for pickup?",
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 50 * 60 * 1000)
          },
          {
            conversationId: savedConversation._id,
            sender: rental.owner,
            receiver: rental.renter,
            content: `I'm available most evenings after 6 PM or weekends. I can meet you at ${item.location.address} or somewhere nearby that's convenient for you.`,
            messageType: 'text',
            relatedItem: rental.item,
            isRead: true,
            createdAt: new Date(rental.createdAt.getTime() + 65 * 60 * 1000)
          },
          {
            conversationId: savedConversation._id,
            sender: rental.renter,
            receiver: rental.owner,
            content: "That works for me! I'll meet you at your location. Looking forward to it!",
            messageType: 'text',
            relatedRental: rental._id,
            isRead: rental.rentalStatus === 'active',
            createdAt: new Date(rental.createdAt.getTime() + 70 * 60 * 1000)
          }
        ]

        // Add a follow-up message for active rentals
        if (rental.rentalStatus === 'active') {
          messages.push({
            conversationId: savedConversation._id,
            sender: rental.renter,
            receiver: rental.owner,
            content: `Thanks again! The ${item.title} is working great. I'll return it on time as agreed.`,
            messageType: 'text',
            relatedRental: rental._id,
            isRead: Math.random() > 0.5,
            createdAt: new Date(rental.startDate.getTime() + 12 * 60 * 60 * 1000)
          })
        }

        const createdMessages = await MessageModel.insertMany(messages)
        messagesData.push(...createdMessages)

        // Update conversation with last message
        await ConversationModel.findByIdAndUpdate(savedConversation._id, {
          lastMessage: createdMessages[createdMessages.length - 1]._id
        })
      } catch (error) {
        // Skip if conversation already exists
        console.log(`Skipping duplicate conversation for rental ${i}`)
      }
    }

    // Add some standalone conversations for items without rentals (inquiries)
    // Use different users to avoid duplicate key errors
    const usedCombinations = new Set<string>()
    
    // Track existing combinations from active rentals
    for (const rental of activeRentals) {
      const key = `${rental.renter}_${rental.item}`
      usedCombinations.add(key)
    }
    
    let inquiriesCreated = 0
    for (let i = 0; i < createdItems.length && inquiriesCreated < 3; i++) {
      const item = createdItems[i]
      const availableUsers = userIds.filter(id => !id.equals(item.owner))
      
      // Find a user that hasn't had a conversation about this item yet
      for (const inquirer of availableUsers) {
        const key = `${inquirer}_${item._id}`
        if (!usedCombinations.has(key)) {
          // Sort participants consistently
          const participants = [inquirer, item.owner].sort((a, b) => 
            a.toString().localeCompare(b.toString())
          )
          
          const conversation = new ConversationModel({
            participants,
            item: item._id,
            isActive: true
          })
          
          try {
            const savedConversation = await conversation.save()
            conversationsData.push(savedConversation)
            usedCombinations.add(key)

            const inquiryMessages = [
              {
                conversationId: savedConversation._id,
                sender: inquirer,
                receiver: item.owner,
                content: `Hi! I saw your ${item.title} listing. Is this still available? I'd like to know more about it.`,
                messageType: 'text',
                relatedItem: item._id,
                isRead: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
              },
              {
                conversationId: savedConversation._id,
                sender: item.owner,
                receiver: inquirer,
                content: `Yes, it's still available! What would you like to know about it?`,
                messageType: 'text',
                relatedItem: item._id,
                isRead: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
              },
              {
                conversationId: savedConversation._id,
                sender: inquirer,
                receiver: item.owner,
                content: `Can you tell me about the condition and what's included? Also, are you flexible on the daily rate for longer rentals?`,
                messageType: 'text',
                relatedItem: item._id,
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
              }
            ]

            const createdInquiryMessages = await MessageModel.insertMany(inquiryMessages)
            messagesData.push(...createdInquiryMessages)

            await ConversationModel.findByIdAndUpdate(savedConversation._id, {
              lastMessage: createdInquiryMessages[createdInquiryMessages.length - 1]._id
            })
            
            inquiriesCreated++
            break // Move to next item
          } catch (error) {
            // Skip if conversation already exists
            console.log(`Skipping duplicate inquiry conversation`)
            continue
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dummy data created successfully!',
      data: {
        items: createdItems.length,
        requests: createdRequests.length,
        rentals: createdRentals.length,
        reviews: createdReviews.length,
        conversations: conversationsData.length,
        messages: messagesData.length
      }
    })

  } catch (error) {
    console.error('Error creating dummy data:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create dummy data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}