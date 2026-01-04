#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  error?: string
  tests: number
  passedTests: number
  failedTests: number
  details?: any[]
}

interface TestReport {
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    successRate: number
    totalDuration: number
    timestamp: string
  }
  suites: TestResult[]
  recommendations: string[]
  performance: {
    averageDuration: number
    slowestSuite: string
    fastestSuite: string
  }
  coverage: {
    api: number
    ui: number
    security: number
    performance: number
    accessibility: number
    pwa: number
  }
}

class TestReportGenerator {
  private results: TestResult[] = []
  private reportPath: string = 'test-results'

  constructor() {
    // Ensure test-results directory exists
    if (!existsSync(this.reportPath)) {
      mkdirSync(this.reportPath, { recursive: true })
    }
  }

  async generateReport(): Promise<void> {
    console.log('📊 Generating Comprehensive E2E Test Report...')
    
    // Run all test suites
    await this.runTestSuites()
    
    // Generate HTML report
    await this.generateHTMLReport()
    
    // Generate JSON report
    await this.generateJSONReport()
    
    // Generate Markdown report
    await this.generateMarkdownReport()
    
    console.log('✅ Test report generated successfully!')
    console.log(`📁 Report location: ${this.reportPath}/`)
  }

  private async runTestSuites(): Promise<void> {
    const testSuites = [
      'comprehensive',
      'api',
      'performance',
      'security',
      'accessibility',
      'pwa'
    ]

    for (const suite of testSuites) {
      console.log(`🧪 Running ${suite} tests...`)
      
      try {
        const output = execSync(
          `npx playwright test tests/e2e/${suite}.spec.ts --reporter=json`,
          { encoding: 'utf8', stdio: 'pipe' }
        )
        
        const result = JSON.parse(output)
        this.results.push({
          suite,
          passed: result.stats.failed === 0,
          duration: result.stats.duration,
          tests: result.stats.total,
          passedTests: result.stats.passed,
          failedTests: result.stats.failed,
          details: result.suites
        })
        
        console.log(`✅ ${suite} tests completed`)
      } catch (error: any) {
        this.results.push({
          suite,
          passed: false,
          duration: 0,
          error: error.message,
          tests: 0,
          passedTests: 0,
          failedTests: 1
        })
        
        console.log(`❌ ${suite} tests failed: ${error.message}`)
      }
    }
  }

  private async generateHTMLReport(): Promise<void> {
    const report: TestReport = this.generateReportData()
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEOSHOP ULTRA - E2E Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 0; text-align: center; margin-bottom: 30px; border-radius: 10px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card h3 { color: #666; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .summary-card .value { font-size: 2.5rem; font-weight: bold; margin-bottom: 5px; }
        .summary-card.success .value { color: #28a745; }
        .summary-card.danger .value { color: #dc3545; }
        .summary-card.warning .value { color: #ffc107; }
        .summary-card.info .value { color: #17a2b8; }
        .suites { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .suites-header { padding: 20px; border-bottom: 1px solid #eee; }
        .suites-header h2 { color: #333; }
        .suite { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .suite:last-child { border-bottom: none; }
        .suite-info { display: flex; align-items: center; gap: 15px; }
        .suite-status { width: 20px; height: 20px; border-radius: 50%; }
        .suite-status.passed { background: #28a745; }
        .suite-status.failed { background: #dc3545; }
        .suite-name { font-weight: bold; font-size: 1.1rem; }
        .suite-stats { color: #666; font-size: 0.9rem; }
        .recommendations { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 25px; }
        .recommendations h2 { color: #333; margin-bottom: 20px; }
        .recommendation { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #007bff; }
        .coverage { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
        .coverage-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .coverage-bar { background: #e9ecef; height: 10px; border-radius: 5px; margin: 10px 0; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEOSHOP ULTRA</h1>
            <p>Comprehensive E2E Test Report</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card ${report.summary.successRate === 100 ? 'success' : 'danger'}">
                <h3>Success Rate</h3>
                <div class="value">${report.summary.successRate.toFixed(1)}%</div>
            </div>
            <div class="summary-card info">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="summary-card success">
                <h3>Passed</h3>
                <div class="value">${report.summary.passedTests}</div>
            </div>
            <div class="summary-card ${report.summary.failedTests > 0 ? 'danger' : 'success'}">
                <h3>Failed</h3>
                <div class="value">${report.summary.failedTests}</div>
            </div>
            <div class="summary-card warning">
                <h3>Duration</h3>
                <div class="value">${(report.summary.totalDuration / 1000).toFixed(1)}s</div>
            </div>
        </div>
        
        <div class="suites">
            <div class="suites-header">
                <h2>📋 Test Suite Results</h2>
            </div>
            ${report.suites.map(suite => `
                <div class="suite">
                    <div class="suite-info">
                        <div class="suite-status ${suite.passed ? 'passed' : 'failed'}"></div>
                        <div>
                            <div class="suite-name">${suite.suite.toUpperCase()}</div>
                            <div class="suite-stats">${suite.passedTests}/${suite.tests} tests passed • ${(suite.duration / 1000).toFixed(1)}s</div>
                        </div>
                    </div>
                    ${suite.error ? `<div style="color: #dc3545; font-size: 0.9rem;">${suite.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="coverage">
            <div class="coverage-card">
                <h3>API Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.api}%"></div>
                </div>
                <div>${report.coverage.api}%</div>
            </div>
            <div class="coverage-card">
                <h3>UI Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.ui}%"></div>
                </div>
                <div>${report.coverage.ui}%</div>
            </div>
            <div class="coverage-card">
                <h3>Security Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.security}%"></div>
                </div>
                <div>${report.coverage.security}%</div>
            </div>
            <div class="coverage-card">
                <h3>Performance Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.performance}%"></div>
                </div>
                <div>${report.coverage.performance}%</div>
            </div>
            <div class="coverage-card">
                <h3>Accessibility Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.accessibility}%"></div>
                </div>
                <div>${report.coverage.accessibility}%</div>
            </div>
            <div class="coverage-card">
                <h3>PWA Coverage</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${report.coverage.pwa}%"></div>
                </div>
                <div>${report.coverage.pwa}%</div>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by NEOSHOP ULTRA E2E Test Suite</p>
            <p>For more information, visit our <a href="/docs">documentation</a></p>
        </div>
    </div>
</body>
</html>
    `
    
    writeFileSync(path.join(this.reportPath, 'e2e-report.html'), html)
  }

  private async generateJSONReport(): Promise<void> {
    const report: TestReport = this.generateReportData()
    writeFileSync(
      path.join(this.reportPath, 'e2e-report.json'),
      JSON.stringify(report, null, 2)
    )
  }

  private async generateMarkdownReport(): Promise<void> {
    const report: TestReport = this.generateReportData()
    
    const markdown = `# NEOSHOP ULTRA - E2E Test Report

Generated on: ${new Date().toLocaleString()}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Success Rate | ${report.summary.successRate.toFixed(1)}% |
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.passedTests} |
| Failed | ${report.summary.failedTests} |
| Duration | ${(report.summary.totalDuration / 1000).toFixed(1)}s |

## 📋 Test Suite Results

${report.suites.map(suite => `
### ${suite.suite.toUpperCase()}
- **Status**: ${suite.passed ? '✅ PASSED' : '❌ FAILED'}
- **Tests**: ${suite.passedTests}/${suite.tests}
- **Duration**: ${(suite.duration / 1000).toFixed(1)}s
${suite.error ? `- **Error**: ${suite.error}` : ''}
`).join('')}

## 📈 Coverage

| Area | Coverage |
|------|----------|
| API | ${report.coverage.api}% |
| UI | ${report.coverage.ui}% |
| Security | ${report.coverage.security}% |
| Performance | ${report.coverage.performance}% |
| Accessibility | ${report.coverage.accessibility}% |
| PWA | ${report.coverage.pwa}% |

## 💡 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🚀 Performance Insights

- **Average Duration**: ${(report.performance.averageDuration / 1000).toFixed(1)}s
- **Slowest Suite**: ${report.performance.slowestSuite}
- **Fastest Suite**: ${report.performance.fastestSuite}

---
*Generated by NEOSHOP ULTRA E2E Test Suite*
`
    
    writeFileSync(path.join(this.reportPath, 'e2e-report.md'), markdown)
  }

  private generateReportData(): TestReport {
    const totalTests = this.results.reduce((sum, result) => sum + result.tests, 0)
    const totalPassed = this.results.reduce((sum, result) => sum + result.passedTests, 0)
    const totalFailed = this.results.reduce((sum, result) => sum + result.failedTests, 0)
    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0)
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

    // Calculate performance metrics
    const durations = this.results.map(r => r.duration)
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const slowestSuite = this.results.reduce((max, result) => 
      result.duration > max.duration ? result : max
    ).suite
    const fastestSuite = this.results.reduce((min, result) => 
      result.duration < min.duration ? result : min
    ).suite

    // Calculate coverage (simplified)
    const coverage = {
      api: this.calculateCoverage('api'),
      ui: this.calculateCoverage('ui'),
      security: this.calculateCoverage('security'),
      performance: this.calculateCoverage('performance'),
      accessibility: this.calculateCoverage('accessibility'),
      pwa: this.calculateCoverage('pwa')
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations()

    return {
      summary: {
        totalTests,
        passedTests: totalPassed,
        failedTests: totalFailed,
        successRate,
        totalDuration,
        timestamp: new Date().toISOString()
      },
      suites: this.results,
      recommendations,
      performance: {
        averageDuration,
        slowestSuite,
        fastestSuite
      },
      coverage
    }
  }

  private calculateCoverage(area: string): number {
    // Simplified coverage calculation
    const suite = this.results.find(r => r.suite === area)
    if (!suite) return 0
    
    if (suite.passed) {
      return Math.min(100, (suite.passedTests / suite.tests) * 100)
    }
    return 0
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    const failedSuites = this.results.filter(r => !r.passed)
    if (failedSuites.length > 0) {
      recommendations.push(`Fix ${failedSuites.length} failing test suite(s): ${failedSuites.map(s => s.suite).join(', ')}`)
    }
    
    const slowSuites = this.results.filter(r => r.duration > 30000)
    if (slowSuites.length > 0) {
      recommendations.push(`Optimize performance for slow test suites: ${slowSuites.map(s => s.suite).join(', ')}`)
    }
    
    const lowCoverage = this.results.filter(r => r.passedTests / r.tests < 0.8)
    if (lowCoverage.length > 0) {
      recommendations.push(`Improve test coverage for: ${lowCoverage.map(s => s.suite).join(', ')}`)
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests are passing! Consider adding more edge case tests.')
      recommendations.push('Monitor performance metrics in production.')
      recommendations.push('Regularly update test data and scenarios.')
    }
    
    return recommendations
  }
}

// Run the report generator
async function main() {
  const generator = new TestReportGenerator()
  await generator.generateReport()
}

if (require.main === module) {
  main().catch(console.error)
}

export { TestReportGenerator }




