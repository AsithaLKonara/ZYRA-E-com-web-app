'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  // Verify email with token
  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email');
      }

      setIsVerified(true);
      toast({
        title: 'Email verified successfully!',
        description: 'Your email has been verified',
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Failed to verify email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please provide an email address to resend verification',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      toast({
        title: 'Verification email sent!',
        description: 'Check your email for verification instructions',
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Failed to resend verification',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Icons.Check className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Email verified successfully!
              </CardTitle>
              <CardDescription>
                Your email has been verified. You can now sign in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Sign in to your account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Icons.Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Verifying your email...
              </CardTitle>
              <CardDescription>
                Please wait while we verify your email address
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Verify your email
            </CardTitle>
            <CardDescription className="text-center">
              {email ? `We've sent a verification link to ${email}` : 'Please check your email for verification instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {!error && !isVerified && (
              <Alert>
                <Icons.Mail className="h-4 w-4" />
                <AlertDescription>
                  Click the verification link in your email to complete the process.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {email && (
                <Button
                  onClick={resendVerification}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resend verification email
                </Button>
              )}

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already verified? </span>
                <Link
                  href="/auth/signin"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



