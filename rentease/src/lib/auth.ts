import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'

export const authOptions: AuthOptions = {
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
      if (url.includes('/auth/callback/')) {
        return `${baseUrl}/dashboard`
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
    async jwt({ token, user }) {
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
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'facebook' || account?.provider === 'apple') {
        await connectDB()
        
        let existingUser = await UserModel.findOne({ email: user.email })
        
        if (!existingUser) {
          existingUser = await UserModel.create({
            email: user.email,
            name: user.name,
            image: user.image,
            isVerified: true,
            provider: account.provider,
            providerId: account.providerAccountId,
          })
        } else {
          existingUser = await UserModel.findOneAndUpdate(
            { email: user.email },
            { 
              name: user.name,
              image: user.image,
              provider: account.provider,
              providerId: account.providerAccountId,
              isVerified: true,
            },
            { new: true }
          )
        }
        
        if (existingUser) {
          user.id = existingUser._id.toString()
        }
      }
      
      return true
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
