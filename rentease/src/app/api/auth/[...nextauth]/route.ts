import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'

const client = new MongoClient(process.env.MONGODB_URI!)

export const authOptions: AuthOptions = {
  // Comment out adapter to handle OAuth manually
  // adapter: MongoDBAdapter(client),
  // Allow linking accounts with same email
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()
        
        const user = await UserModel.findOne({ email: credentials.email }).select('+password')
        
        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure OAuth redirects go to dashboard
      if (url.includes('/auth/callback/')) {
        return `${baseUrl}/dashboard`
      }
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If it's the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url
      // Otherwise, redirect to dashboard
      return `${baseUrl}/dashboard`
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook' || account?.provider === 'apple') {
        await connectDB()
        
        let existingUser = await UserModel.findOne({ email: user.email })
        
        if (!existingUser) {
          // Create new user for OAuth
          existingUser = await UserModel.create({
            email: user.email,
            name: user.name,
            image: user.image,
            isVerified: true,
            provider: account.provider,
            providerId: account.providerAccountId,
          })
        } else {
          // Update existing user with OAuth info if needed
          existingUser = await UserModel.findOneAndUpdate(
            { email: user.email },
            { 
              $set: {
                image: user.image || existingUser.image,
                isVerified: true,
                provider: account.provider,
                providerId: account.providerAccountId,
              }
            },
            { new: true }
          )
        }
        
        // Update user object with database ID
        user.id = existingUser._id.toString()
      }
      return true
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }