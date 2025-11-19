'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Layout from '@/components/layout/Layout'
import RecommendationSection from '@/components/recommendations/RecommendationSection'
import { 
  DollarSign, 
  Users, 
  Heart,
  ArrowRight
} from 'lucide-react'

export default function HomePage() {
  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Share. Rent. Save.
            <span className="text-primary block">Build Community.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with neighbors to rent household items you need or earn money 
            from items you own. Sustainable living made simple.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/search">
                Browse Items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/items/new">
                List Your Items
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose RentEase?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Save Money</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Why buy when you can rent? Access items at a fraction of the cost.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Earn Income</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Turn your unused items into income by renting them to neighbors.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Build Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with neighbors and build trust through sharing.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <RecommendationSection 
            title="🔥 Popular Items" 
            type="popular"
            limit={8}
          />
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <RecommendationSection 
            title="⚡ Trending Now" 
            type="trending"
            limit={8}
          />
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <RecommendationSection 
            title="✨ For You" 
            type="personalized"
            limit={8}
          />
        </div>
      </section>
    </Layout>
  )
}
