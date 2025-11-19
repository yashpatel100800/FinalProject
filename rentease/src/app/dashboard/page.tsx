'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Star, 
  Calendar, 
  TrendingUp,
  Package,
  Users,
  MapPin
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    itemCount: 0,
    activeRentals: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [itemsRentedOut, setItemsRentedOut] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/auth/signin')
    } else {
      fetchUserStats()
    }
  }, [session, status, router])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentActivities(data.recentActivities || [])
        setItemsRentedOut(data.itemsRentedOut || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user?.name || session.user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Ready to share, rent, or discover items in your community?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">List an Item</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Share items you own and earn money from your neighbors
              </CardDescription>
              <Button asChild className="w-full">
                <Link href="/items/new">List Item</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Find Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Browse available items in your neighborhood
              </CardDescription>
              <Button asChild variant="outline" className="w-full">
                <Link href="/items">Browse Items</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Chat with other community members
              </CardDescription>
              <Button asChild variant="outline" className="w-full">
                <Link href="/messages">View Messages</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.itemCount}</div>
              <p className="text-xs text-muted-foreground">
                Items available for rent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeRentals}</div>
              <p className="text-xs text-muted-foreground">
                Currently rented out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${loading ? '...' : stats.monthlyEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Earnings this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.0</div>
              <p className="text-xs text-muted-foreground">
                Average rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Your Items Rented Out</span>
              </CardTitle>
              <CardDescription>
                Items currently rented to others
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : itemsRentedOut.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No items currently rented out</p>
                  <Button asChild>
                    <Link href="/items/new">List Your First Item</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {itemsRentedOut.map((rental: any) => (
                    <div key={rental._id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <img
                        src={rental.item?.images?.[0] || '/placeholder.jpg'}
                        alt={rental.item?.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{rental.item?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Rented to: {rental.renter?.name}
                        </p>
                        <Badge variant={
                          rental.rentalStatus === 'active' ? 'default' :
                          rental.rentalStatus === 'approved' ? 'secondary' :
                          rental.rentalStatus === 'returned' ? 'outline' : 'secondary'
                        }>
                          {rental.rentalStatus}
                        </Badge>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/rentals/${rental._id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your latest rentals and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No recent activity</p>
                  <Button asChild variant="outline">
                    <Link href="/search">Start Browsing</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivities.map((rental: any) => (
                    <div key={rental._id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <img
                        src={rental.item?.images?.[0] || '/placeholder.jpg'}
                        alt={rental.item?.title}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{rental.item?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {rental.owner._id === (session?.user as any)?.id 
                            ? `Rented to ${rental.renter?.name}`
                            : `Rented from ${rental.owner?.name}`
                          }
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rental.rentalStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rental.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}