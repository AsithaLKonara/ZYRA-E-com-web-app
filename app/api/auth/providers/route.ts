import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { authProviders } from '@/lib/env'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'

// Get available OAuth providers
async function getProvidersHandler(request: NextRequest) {
  try {
    const providers = []

    // Google provider
    if (authProviders.google.clientId && authProviders.google.clientSecret) {
      providers.push({
        id: 'google',
        name: 'Google',
        type: 'oauth',
        enabled: true,
        clientId: authProviders.google.clientId ? 'configured' : 'not-configured',
      })
    }

    // GitHub provider
    if (authProviders.github.clientId && authProviders.github.clientSecret) {
      providers.push({
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        enabled: true,
        clientId: authProviders.github.clientId ? 'configured' : 'not-configured',
      })
    }

    // Credentials provider
    providers.push({
      id: 'credentials',
      name: 'Email/Password',
      type: 'credentials',
      enabled: true,
    })

    return NextResponse.json({
      success: true,
      providers,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get providers' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(getProvidersHandler))




