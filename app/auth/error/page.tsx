'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  OAuthSignin: 'Error occurred during OAuth sign in.',
  OAuthCallback: 'Error occurred during OAuth callback.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create account with email.',
  Callback: 'Error occurred during callback.',
  OAuthAccountNotLinked: 'Email already exists with different provider.',
  EmailSignin: 'Check your email for sign in link.',
  CredentialsSignin: 'Sign in failed. Check your credentials.',
  SessionRequired: 'Please sign in to access this page.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') as keyof typeof errorMessages;
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Icons.alertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Authentication Error
            </CardTitle>
            <CardDescription>
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <Icons.alertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>

              <Button
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full"
              >
                <Icons.logIn className="mr-2 h-4 w-4" />
                Try signing in again
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Need help? </span>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-500"
              >
                Contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



