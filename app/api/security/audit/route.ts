import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { runSecurityAudit, getSecurityMetrics, getSecurityResultsByCategory, getSecurityResultsBySeverity } from '@/lib/security-audit'
import { logger } from '@/lib/logger'

// Get security audit results
async function getAuditResultsHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can access security audit results
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')
    const action = searchParams.get('action')

    let results

    switch (action) {
      case 'metrics':
        results = getSecurityMetrics()
        break
      case 'category':
        if (!category) {
          return NextResponse.json(
            { success: false, error: 'Category parameter required' },
            { status: 400 }
          )
        }
        results = getSecurityResultsByCategory(category)
        break
      case 'severity':
        if (!severity) {
          return NextResponse.json(
            { success: false, error: 'Severity parameter required' },
            { status: 400 }
          )
        }
        results = getSecurityResultsBySeverity(severity)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

    logger.info('Security audit results accessed', {
      userId: user.id,
      action,
      category,
      severity,
    })

    return NextResponse.json({
      success: true,
      data: results,
    })

  } catch (error) {
    logger.error('Error getting security audit results:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to get security audit results' },
      { status: 500 }
    )
  }
}

// Run security audit
async function runAuditHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can run security audits
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    logger.info('Security audit started', {
      userId: user.id,
      timestamp: new Date(),
    })

    const results = await runSecurityAudit()

    logger.info('Security audit completed', {
      userId: user.id,
      resultsCount: results.length,
      criticalIssues: results.filter(r => r.severity === 'critical').length,
      highIssues: results.filter(r => r.severity === 'high').length,
      mediumIssues: results.filter(r => r.severity === 'medium').length,
      lowIssues: results.filter(r => r.severity === 'low').length,
    })

    return NextResponse.json({
      success: true,
      message: 'Security audit completed successfully',
      data: {
        results,
        summary: {
          total: results.length,
          critical: results.filter(r => r.severity === 'critical').length,
          high: results.filter(r => r.severity === 'high').length,
          medium: results.filter(r => r.severity === 'medium').length,
          low: results.filter(r => r.severity === 'low').length,
        },
      },
    })

  } catch (error) {
    logger.error('Error running security audit:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to run security audit' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAuth(getAuditResultsHandler)))
export const POST = withApiVersioning(withErrorHandler(withAuth(runAuditHandler)))

