#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { logger } from '../lib/logger'

interface ChecklistItem {
  name: string
  command: string
  description: string
  critical: boolean
}

const checklist: ChecklistItem[] = [
  // Code Quality
  {
    name: 'Type Check',
    command: 'npm run type-check',
    description: 'Run TypeScript type checking',
    critical: true,
  },
  {
    name: 'Lint Check',
    command: 'npm run lint:check',
    description: 'Run ESLint code quality checks',
    critical: true,
  },
  {
    name: 'Format Check',
    command: 'npm run format:check',
    description: 'Check code formatting with Prettier',
    critical: false,
  },
  
  // Testing
  {
    name: 'Unit Tests',
    command: 'npm run test:ci',
    description: 'Run unit tests with coverage',
    critical: true,
  },
  {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    description: 'Run end-to-end tests',
    critical: true,
  },
  
  // Build
  {
    name: 'Production Build',
    command: 'npm run build',
    description: 'Build production bundle',
    critical: true,
  },
  
  // Security
  {
    name: 'Security Audit',
    command: 'npm audit --audit-level moderate',
    description: 'Check for security vulnerabilities',
    critical: true,
  },
  {
    name: 'Dependency Check',
    command: 'npm outdated',
    description: 'Check for outdated dependencies',
    critical: false,
  },
  
  // Database
  {
    name: 'Database Migration',
    command: 'npm run db:migrate:deploy',
    description: 'Run database migrations',
    critical: true,
  },
  {
    name: 'Database Health',
    command: 'npm run db:setup',
    description: 'Check database health and setup',
    critical: true,
  },
  
  // Performance
  {
    name: 'Bundle Analysis',
    command: 'npm run build && npx @next/bundle-analyzer',
    description: 'Analyze bundle size and performance',
    critical: false,
  },
]

class LaunchChecklist {
  private results: Array<{ item: ChecklistItem; success: boolean; output: string; error?: string }> = []

  async runChecklist() {
    logger.info('🚀 Starting launch checklist...')
    
    for (const item of checklist) {
      await this.runItem(item)
    }
    
    this.printResults()
    this.generateReport()
  }

  private async runItem(item: ChecklistItem) {
    logger.info(`⏳ Running: ${item.name}`)
    
    try {
      const output = execSync(item.command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
      })
      
      this.results.push({
        item,
        success: true,
        output: output.toString(),
      })
      
      logger.info(`✅ ${item.name}: PASSED`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.results.push({
        item,
        success: false,
        output: '',
        error: errorMessage,
      })
      
      if (item.critical) {
        logger.error(`❌ ${item.name}: FAILED (CRITICAL)`)
      } else {
        logger.warn(`⚠️ ${item.name}: FAILED (NON-CRITICAL)`)
      }
    }
  }

  private printResults() {
    console.log('\n' + '='.repeat(80))
    console.log('🚀 LAUNCH CHECKLIST RESULTS')
    console.log('='.repeat(80))
    
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const critical = this.results.filter(r => !r.success && r.item.critical).length
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Passed: ${passed}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   🔴 Critical Failures: ${critical}`)
    
    console.log(`\n📋 Detailed Results:`)
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : (result.item.critical ? '❌' : '⚠️')
      const criticality = result.item.critical ? ' (CRITICAL)' : ' (NON-CRITICAL)'
      
      console.log(`\n${index + 1}. ${status} ${result.item.name}${criticality}`)
      console.log(`   Description: ${result.item.description}`)
      
      if (!result.success) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    if (critical > 0) {
      console.log(`\n🚨 CRITICAL FAILURES DETECTED!`)
      console.log(`   Please fix the critical issues before launching.`)
    } else if (failed > 0) {
      console.log(`\n⚠️  Some non-critical issues were found.`)
      console.log(`   Consider fixing them for better quality.`)
    } else {
      console.log(`\n🎉 All checks passed! Ready for launch!`)
    }
  }

  private generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        critical: this.results.filter(r => !r.success && r.item.critical).length,
      },
      results: this.results.map(result => ({
        name: result.item.name,
        description: result.item.description,
        critical: result.item.critical,
        success: result.success,
        error: result.error,
      })),
      recommendations: this.generateRecommendations(),
    }
    
    const fs = require('fs')
    const path = require('path')
    
    const reportPath = path.join(process.cwd(), 'launch-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    logger.info(`📄 Launch report generated: ${reportPath}`)
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    const criticalFailures = this.results.filter(r => !r.success && r.item.critical)
    const nonCriticalFailures = this.results.filter(r => !r.success && !r.item.critical)
    
    if (criticalFailures.length > 0) {
      recommendations.push('Fix all critical failures before launching')
      recommendations.push('Run the checklist again after fixes')
    }
    
    if (nonCriticalFailures.length > 0) {
      recommendations.push('Consider fixing non-critical issues for better quality')
    }
    
    if (this.results.every(r => r.success)) {
      recommendations.push('All checks passed! Ready for launch!')
      recommendations.push('Consider setting up monitoring and alerts')
      recommendations.push('Prepare rollback plan in case of issues')
    }
    
    return recommendations
  }
}

// CLI interface
async function main() {
  const checklist = new LaunchChecklist()
  
  try {
    await checklist.runChecklist()
    
    const criticalFailures = checklist['results'].filter((r: any) => !r.success && r.item.critical).length
    
    if (criticalFailures > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  } catch (error) {
    logger.error('Launch checklist failed:', {}, error instanceof Error ? error : new Error(String(error)))
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { LaunchChecklist }




