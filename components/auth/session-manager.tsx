'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { logger } from '@/lib/logger'

interface Session {
  id: string
  createdAt: string
  expires: string
  isActive: boolean
}

export function SessionManager() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      setSessions(data.sessions)
    } catch (error) {
      logger.error('Error fetching sessions:', {}, error instanceof Error ? error : new Error(String(error)))
      setError(error instanceof Error ? error.message : 'Failed to fetch sessions')
    } finally {
      setIsLoading(false)
    }
  }

  // Revoke session
  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke session')
      }

      // Remove session from list
      setSessions(prev => prev.filter(session => session.id !== sessionId))
      logger.info('Session revoked', { sessionId })
    } catch (error) {
      logger.error('Error revoking session:', {}, error instanceof Error ? error : new Error(String(error)))
      setError(error instanceof Error ? error.message : 'Failed to revoke session')
    }
  }

  // Revoke all sessions
  const revokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all sessions? You will be signed out from all devices.')) {
      return
    }

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke sessions')
      }

      // Clear all sessions
      setSessions([])
      logger.info('All sessions revoked')
    } catch (error) {
      logger.error('Error revoking all sessions:', {}, error instanceof Error ? error : new Error(String(error)))
      setError(error instanceof Error ? error.message : 'Failed to revoke sessions')
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across different devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sessions.length === 0 ? (
          <p className="text-muted-foreground">No active sessions found</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(session.expires).toLocaleString()}
                  </p>
                </div>
                {session.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={revokeAllSessions}
              className="w-full"
            >
              Revoke All Sessions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




