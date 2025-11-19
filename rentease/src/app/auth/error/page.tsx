'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Layout from '@/components/layout/Layout'
import { AlertTriangle } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.'
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account in the database.'
      case 'EmailCreateAccount':
        return 'Could not create email account in the database.'
      case 'Callback':
        return 'Error in the OAuth callback handler route.'
      case 'OAuthAccountNotLinked':
        return 'Email on the account is already linked, but not with this OAuth account.'
      case 'EmailSignin':
        return 'Sending the e-mail with the verification token failed.'
      case 'CredentialsSignin':
        return 'The authorize callback returned null in the Credentials provider.'
      case 'SessionRequired':
        return 'The content of this page requires you to be signed in at all times.'
      default:
        return 'An unknown error occurred during authentication.'
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription>
              There was a problem signing you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {getErrorMessage(error)}
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  Try Again
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              If this problem persists, please{' '}
              <Link href="/contact" className="font-medium text-primary hover:underline">
                contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}