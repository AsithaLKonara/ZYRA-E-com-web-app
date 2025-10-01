#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { logger } from '../lib/logger'

interface MigrationOptions {
  environment?: 'development' | 'staging' | 'production'
  reset?: boolean
  force?: boolean
  skipSeed?: boolean
}

class DatabaseMigrator {
  private environment: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  async migrate(options: MigrationOptions = {}) {
    const { environment = 'development', reset = false, force = false, skipSeed = false } = options

    try {
      logger.info(`Starting database migration for ${environment} environment...`)

      if (reset) {
        await this.resetDatabase(force)
      }

      // Generate Prisma client
      logger.info('Generating Prisma client...')
      execSync('npx prisma generate', { stdio: 'inherit' })

      // Run migrations
      if (environment === 'production') {
        logger.info('Running production migrations...')
        execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      } else {
        logger.info('Running development migrations...')
        execSync('npx prisma migrate dev', { stdio: 'inherit' })
      }

      // Seed database if not skipped
      if (!skipSeed && environment !== 'production') {
        logger.info('Seeding database...')
        execSync('npm run db:seed', { stdio: 'inherit' })
      }

      logger.info('Database migration completed successfully!')
    } catch (error) {
      logger.error('Database migration failed:', error)
      throw error
    }
  }

  async resetDatabase(force: boolean = false) {
    try {
      logger.info('Resetting database...')
      
      if (force) {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' })
      } else {
        execSync('npx prisma migrate reset', { stdio: 'inherit' })
      }
      
      logger.info('Database reset completed')
    } catch (error) {
      logger.error('Database reset failed:', error)
      throw error
    }
  }

  async createMigration(name: string) {
    try {
      logger.info(`Creating migration: ${name}`)
      execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' })
      logger.info(`Migration created: ${name}`)
    } catch (error) {
      logger.error('Failed to create migration:', error)
      throw error
    }
  }

  async status() {
    try {
      logger.info('Checking migration status...')
      execSync('npx prisma migrate status', { stdio: 'inherit' })
    } catch (error) {
      logger.error('Failed to check migration status:', error)
      throw error
    }
  }

  async deploy() {
    try {
      logger.info('Deploying migrations to production...')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      logger.info('Migrations deployed successfully')
    } catch (error) {
      logger.error('Migration deployment failed:', error)
      throw error
    }
  }

  async rollback() {
    try {
      logger.info('Rolling back last migration...')
      // Note: Prisma doesn't have built-in rollback, this would need custom implementation
      logger.warn('Rollback not implemented - manual intervention required')
    } catch (error) {
      logger.error('Migration rollback failed:', error)
      throw error
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const migrator = new DatabaseMigrator()

  try {
    switch (command) {
      case 'migrate':
        const environment = process.argv[3] as 'development' | 'staging' | 'production' || 'development'
        await migrator.migrate({ environment })
        break

      case 'reset':
        const force = process.argv[3] === '--force'
        await migrator.resetDatabase(force)
        break

      case 'create':
        const name = process.argv[3]
        if (!name) {
          throw new Error('Migration name is required')
        }
        await migrator.createMigration(name)
        break

      case 'status':
        await migrator.status()
        break

      case 'deploy':
        await migrator.deploy()
        break

      case 'rollback':
        await migrator.rollback()
        break

      default:
        console.log(`
Database Migration Tool

Usage:
  npm run db:migrate migrate [environment]  Run migrations
  npm run db:migrate reset [--force]        Reset database
  npm run db:migrate create <name>          Create new migration
  npm run db:migrate status                 Check migration status
  npm run db:migrate deploy                 Deploy to production
  npm run db:migrate rollback               Rollback last migration

Environments:
  development  (default) - Run dev migrations with seeding
  staging      - Run production migrations without seeding
  production   - Deploy migrations to production
        `)
    }
  } catch (error) {
    logger.error('Migration operation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DatabaseMigrator }




