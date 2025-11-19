'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  MessageSquare, 
  User, 
  Plus, 
  Menu, 
  Home,
  MapPin,
  Bell,
  Settings
} from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl hidden sm:inline">RentEase</span>
        </Link>

        {/* Search Bar - Hidden on mobile and small laptops */}
        <div className="hidden xl:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search for items..."
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
            />
          </div>
        </div>

        {/* Navigation - Compact spacing */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link href="/search" className="text-sm text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap">
              Search
            </Link>
            <Link href="/items" className="text-sm text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap">
              Browse
            </Link>
            <Link href="/rentals" className="text-sm text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap">
              Rentals
            </Link>
            <Link href="/requests" className="text-sm text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap">
              Requests
            </Link>
          </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
          {session ? (
            <>
              {/* Authenticated user actions */}
              <Button asChild size="sm" className="hidden lg:flex">
                <Link href="/items/new">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden xl:inline">List Item</span>
                  <span className="xl:hidden">List</span>
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                <Link href="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/my-items" 
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Items
                    </Link>
                    <Link 
                      href="/rentals" 
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Rentals
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 inline mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-accent text-red-600"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Guest user actions */}
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
          
          {/* Mobile/Tablet menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile/Tablet menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-2">
            {/* Mobile search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search for items..."
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
            
            <Link 
              href="/search" 
              className="block py-2 px-4 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Search
            </Link>
            <Link 
              href="/items" 
              className="block py-2 px-4 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              Browse Items
            </Link>
            <Link 
              href="/rentals" 
              className="block py-2 px-4 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              My Rentals
            </Link>
            <Link 
              href="/requests" 
              className="block py-2 px-4 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Requests
            </Link>
            
            {session && (
              <>
                <Link 
                  href="/items/new" 
                  className="block py-2 px-4 hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  List Item
                </Link>
                <Link 
                  href="/messages" 
                  className="block py-2 px-4 hover:bg-accent rounded-md md:hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Messages
                </Link>
                <Link 
                  href="/notifications" 
                  className="block py-2 px-4 hover:bg-accent rounded-md md:hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell className="h-4 w-4 inline mr-2" />
                  Notifications
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}