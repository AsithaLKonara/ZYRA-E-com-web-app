#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

interface TestConfig {
  name: string
  file: string
  description: string
  critical: boolean
}

const testSuites: TestConfig[] = [
  {
    name: 'comprehensive',
    file: 'tests/e2e/comprehensive.spec.ts',
    description: 'Comprehensive E2E tests covering all major functionalities',
    critical: true
  },
  {
    name: 'api',
    file: 'tests/e2e/api.spec.ts',
    description: 'API endpoint E2E tests',
    critical: true
  },
  {
    name: 'performance',
    file: 'tests/e2e/performance.spec.ts',
    description: 'Performance E2E tests',
    critical: true
  },
  {
    name: 'security',
    file: 'tests/e2e/security.spec.ts',
    description: 'Security E2E tests',
    critical: true
  },
  {
    name: 'accessibility',
    file: 'tests/e2e/accessibility.spec.ts',
    description: 'Accessibility E2E tests',
    critical: false
  },
  {
    name: 'pwa',
    file: 'tests/e2e/pwa.spec.ts',
    description: 'PWA functionality E2E tests',
    critical: false
  }
]

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  error?: string
  tests: number
  passedTests: number
  failedTests: number
}

class E2ETestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive E2E Test Suite for NEOSHOP ULTRA')
    console.log('=' .repeat(60))
    
    this.startTime = Date.now()
    
    // Check if Playwright is installed
    if (!this.isPlaywrightInstalled()) {
      console.log('❌ Playwright is not installed. Installing...')
      this.installPlaywright()
    }
    
    // Run each test suite
    for (const suite of testSuites) {
      await this.runTestSuite(suite)
    }
    
    this.printSummary()
  }

  private isPlaywrightInstalled(): boolean {
    try {
      execSync('npx playwright --version', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  private installPlaywright(): void {
    try {
      console.log('📦 Installing Playwright...')
      execSync('npm install @playwright/test', { stdio: 'inherit' })
      execSync('npx playwright install', { stdio: 'inherit' })
      console.log('✅ Playwright installed successfully')
    } catch (error) {
      console.error('❌ Failed to install Playwright:', error)
      process.exit(1)
    }
  }

  private async runTestSuite(suite: TestConfig): Promise<void> {
    console.log(`\n🧪 Running ${suite.name} tests...`)
    console.log(`📝 ${suite.description}`)
    
    if (!existsSync(suite.file)) {
      console.log(`⚠️  Test file not found: ${suite.file}`)
      this.results.push({
        suite: suite.name,
        passed: false,
        duration: 0,
        error: 'Test file not found',
        tests: 0,
        passedTests: 0,
        failedTests: 0
      })
      return
    }

    const startTime = Date.now()
    
    try {
      // Run the test suite
      const output = execSync(
        `npx playwright test ${suite.file} --reporter=json`,
        { 
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: process.cwd()
        }
      )
      
      const duration = Date.now() - startTime
      const result = JSON.parse(output)
      
      const passed = result.stats.failed === 0
      const tests = result.stats.total
      const passedTests = result.stats.passed
      const failedTests = result.stats.failed
      
      this.results.push({
        suite: suite.name,
        passed,
        duration,
        tests,
        passedTests,
        failedTests
      })
      
      if (passed) {
        console.log(`✅ ${suite.name} tests passed (${tests} tests, ${duration}ms)`)
      } else {
        console.log(`❌ ${suite.name} tests failed (${failedTests}/${tests} failed, ${duration}ms)`)
      }
      
    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: errorMessage,
        tests: 0,
        passedTests: 0,
        failedTests: 1
      })
      
      console.log(`❌ ${suite.name} tests failed: ${errorMessage}`)
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime
    const totalTests = this.results.reduce((sum, result) => sum + result.tests, 0)
    const totalPassed = this.results.reduce((sum, result) => sum + result.passedTests, 0)
    const totalFailed = this.results.reduce((sum, result) => sum + result.failedTests, 0)
    const criticalFailures = this.results.filter(result => !result.passed && testSuites.find(s => s.name === result.suite)?.critical)
    
    console.log('\n' + '=' .repeat(60))
    console.log('📊 E2E Test Summary')
    console.log('=' .repeat(60))
    
    // Overall stats
    console.log(`\n📈 Overall Statistics:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${totalPassed}`)
    console.log(`   Failed: ${totalFailed}`)
    console.log(`   Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`)
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    
    // Test suite results
    console.log(`\n📋 Test Suite Results:`)
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌'
      const critical = testSuites.find(s => s.name === result.suite)?.critical ? '🔴' : '🟡'
      console.log(`   ${status} ${critical} ${result.suite}: ${result.passedTests}/${result.tests} passed (${result.duration}ms)`)
      
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }
    }
    
    // Critical failures
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 Critical Failures:`)
      for (const failure of criticalFailures) {
        console.log(`   ❌ ${failure.suite}: ${failure.error || 'Tests failed'}`)
      }
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (totalFailed === 0) {
      console.log(`   🎉 All tests passed! Your application is ready for production.`)
    } else {
      console.log(`   🔧 Fix failing tests before deploying to production.`)
      if (criticalFailures.length > 0) {
        console.log(`   🚨 Address critical failures immediately.`)
      }
      console.log(`   📝 Review test results and improve test coverage.`)
    }
    
    // Performance insights
    const avgDuration = this.results.reduce((sum, result) => sum + result.duration, 0) / this.results.length
    console.log(`\n⚡ Performance Insights:`)
    console.log(`   Average Test Duration: ${avgDuration.toFixed(0)}ms`)
    if (avgDuration > 30000) {
      console.log(`   ⚠️  Tests are running slowly. Consider optimizing test performance.`)
    } else if (avgDuration < 10000) {
      console.log(`   🚀 Tests are running efficiently!`)
    }
    
    console.log('\n' + '=' .repeat(60))
    
    // Exit with appropriate code
    if (criticalFailures.length > 0) {
      console.log('❌ Critical tests failed. Exiting with error code 1.')
      process.exit(1)
    } else if (totalFailed > 0) {
      console.log('⚠️  Some tests failed. Exiting with error code 1.')
      process.exit(1)
    } else {
      console.log('✅ All tests passed! Exiting with success code 0.')
      process.exit(0)
    }
  }
}

// Run the tests
async function main() {
  const runner = new E2ETestRunner()
  await runner.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { E2ETestRunner }




