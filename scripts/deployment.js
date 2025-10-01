#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Deployment script
class DeploymentScript {
  constructor() {
    this.projectRoot = process.cwd()
    this.env = process.env.NODE_ENV || 'production'
  }

  // Check prerequisites
  checkPrerequisites() {
    console.log('🔍 Checking prerequisites...')
    
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version
          const major = parseInt(version.slice(1).split('.')[0])
          return major >= 18
        },
        error: 'Node.js 18+ is required'
      },
      {
        name: 'Package manager',
        check: () => {
          try {
            execSync('pnpm --version', { stdio: 'pipe' })
            return true
          } catch {
            try {
              execSync('npm --version', { stdio: 'pipe' })
              return true
            } catch {
              return false
            }
          }
        },
        error: 'pnpm or npm is required'
      },
      {
        name: 'Environment variables',
        check: () => {
          const requiredVars = [
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL'
          ]
          return requiredVars.every(varName => process.env[varName])
        },
        error: 'Required environment variables are missing'
      }
    ]

    for (const check of checks) {
      if (!check.check()) {
        console.error(`❌ ${check.name}: ${check.error}`)
        process.exit(1)
      }
      console.log(`✅ ${check.name}`)
    }
  }

  // Install dependencies
  installDependencies() {
    console.log('📦 Installing dependencies...')
    
    try {
      execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' })
      console.log('✅ Dependencies installed')
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message)
      process.exit(1)
    }
  }

  // Run type checking
  runTypeCheck() {
    console.log('🔍 Running type check...')
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' })
      console.log('✅ Type check passed')
    } catch (error) {
      console.error('❌ Type check failed:', error.message)
      process.exit(1)
    }
  }

  // Run linting
  runLinting() {
    console.log('🔍 Running linting...')
    
    try {
      execSync('npx next lint', { stdio: 'inherit' })
      console.log('✅ Linting passed')
    } catch (error) {
      console.error('❌ Linting failed:', error.message)
      process.exit(1)
    }
  }

  // Run tests
  runTests() {
    console.log('🧪 Running tests...')
    
    try {
      execSync('npm run test', { stdio: 'inherit' })
      console.log('✅ Tests passed')
    } catch (error) {
      console.error('❌ Tests failed:', error.message)
      process.exit(1)
    }
  }

  // Build application
  buildApplication() {
    console.log('🏗️  Building application...')
    
    try {
      execSync('npx next build', { stdio: 'inherit' })
      console.log('✅ Application built successfully')
    } catch (error) {
      console.error('❌ Build failed:', error.message)
      process.exit(1)
    }
  }

  // Generate Prisma client
  generatePrismaClient() {
    console.log('🗄️  Generating Prisma client...')
    
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client generated')
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message)
      process.exit(1)
    }
  }

  // Run database migrations
  runMigrations() {
    console.log('🗄️  Running database migrations...')
    
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ Database migrations completed')
    } catch (error) {
      console.error('❌ Database migrations failed:', error.message)
      process.exit(1)
    }
  }

  // Seed database
  seedDatabase() {
    console.log('🌱 Seeding database...')
    
    try {
      execSync('npm run db:seed', { stdio: 'inherit' })
      console.log('✅ Database seeded')
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message)
      process.exit(1)
    }
  }

  // Create deployment package
  createDeploymentPackage() {
    console.log('📦 Creating deployment package...')
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      
      // Create production package.json
      const productionPackage = {
        ...packageJson,
        scripts: {
          start: 'next start',
          build: 'next build',
        },
        devDependencies: {},
      }
      
      fs.writeFileSync(
        'package.production.json',
        JSON.stringify(productionPackage, null, 2)
      )
      
      console.log('✅ Deployment package created')
    } catch (error) {
      console.error('❌ Failed to create deployment package:', error.message)
      process.exit(1)
    }
  }

  // Run deployment
  async run() {
    console.log('🚀 Starting deployment process...')
    
    try {
      this.checkPrerequisites()
      this.installDependencies()
      this.runTypeCheck()
      this.runLinting()
      this.runTests()
      this.generatePrismaClient()
      this.runMigrations()
      this.seedDatabase()
      this.buildApplication()
      this.createDeploymentPackage()
      
      console.log('✅ Deployment completed successfully!')
    } catch (error) {
      console.error('❌ Deployment failed:', error.message)
      process.exit(1)
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new DeploymentScript()
  deployment.run()
}

module.exports = DeploymentScript




