import { exec } from 'child_process'
import { promisify } from 'util'
import { config } from './config'
import { logger } from './logger'

const execAsync = promisify(exec)

// Migration status interface
interface MigrationStatus {
  applied: string[]
  pending: string[]
  lastApplied: Date | null
}

// Database migration class
class DatabaseMigration {
  private migrationPath = './prisma/migrations'

  // Get migration status
  async getStatus(): Promise<MigrationStatus> {
    try {
      // Get applied migrations
      const { stdout: appliedOutput } = await execAsync('npx prisma migrate status --json')
      const appliedData = JSON.parse(appliedOutput)
      
      const applied = appliedData.migrations
        .filter((m: any) => m.status === 'Applied')
        .map((m: any) => m.migration_name)

      // Get all migration files
      const { stdout: lsOutput } = await execAsync(`ls ${this.migrationPath}`)
      const allMigrations = lsOutput
        .trim()
        .split('\n')
        .filter(name => name && !name.includes('migration.sql'))
        .map(name => name.replace(/^\d+_/, '').replace(/_/g, ' '))

      const pending = allMigrations.filter(migration => !applied.includes(migration))

      return {
        applied,
        pending,
        lastApplied: applied.length > 0 ? new Date() : null,
      }
    } catch (error) {
      logger.error('Failed to get migration status:', error)
      return {
        applied: [],
        pending: [],
        lastApplied: null,
      }
    }
  }

  // Apply pending migrations
  async applyMigrations(): Promise<{
    success: boolean
    applied: string[]
    errors: string[]
  }> {
    const result = {
      success: true,
      applied: [] as string[],
      errors: [] as string[],
    }

    try {
      logger.info('Applying database migrations...')
      
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy')
      
      if (stderr) {
        logger.warn('Migration warnings:', stderr)
      }

      logger.success('Database migrations applied successfully')
      
      // Get updated status
      const status = await this.getStatus()
      result.applied = status.applied

    } catch (error) {
      logger.error('Failed to apply migrations:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  // Create new migration
  async createMigration(name: string): Promise<{
    success: boolean
    migrationName?: string
    error?: string
  }> {
    try {
      logger.info(`Creating migration: ${name}`)
      
      const { stdout } = await execAsync(`npx prisma migrate dev --name ${name} --create-only`)
      
      // Extract migration name from output
      const migrationName = stdout.match(/Created migration `(.+)`/)?.[1]
      
      if (migrationName) {
        logger.success(`Migration created: ${migrationName}`)
        return {
          success: true,
          migrationName,
        }
      } else {
        throw new Error('Failed to extract migration name')
      }

    } catch (error) {
      logger.error('Failed to create migration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Reset database
  async resetDatabase(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      logger.warn('Resetting database...')
      
      await execAsync('npx prisma migrate reset --force')
      
      logger.success('Database reset successfully')
      return { success: true }

    } catch (error) {
      logger.error('Failed to reset database:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Generate Prisma client
  async generateClient(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      logger.info('Generating Prisma client...')
      
      await execAsync('npx prisma generate')
      
      logger.success('Prisma client generated successfully')
      return { success: true }

    } catch (error) {
      logger.error('Failed to generate Prisma client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Validate migration files
  async validateMigrations(): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    try {
      // Check if migration directory exists
      const { stdout } = await execAsync(`ls -la ${this.migrationPath}`)
      
      if (!stdout.includes('migration.sql')) {
        errors.push('No migration files found')
      }

      // Check for syntax errors in migration files
      const { stdout: migrationFiles } = await execAsync(`find ${this.migrationPath} -name "*.sql"`)
      const files = migrationFiles.trim().split('\n').filter(Boolean)

      for (const file of files) {
        try {
          // Basic SQL syntax check
          await execAsync(`psql -d ${config.database.url} -f ${file} --dry-run`)
        } catch (error) {
          errors.push(`Syntax error in ${file}: ${error}`)
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }

    } catch (error) {
      errors.push(`Validation failed: ${error}`)
      return {
        valid: false,
        errors,
      }
    }
  }

  // Get migration history
  async getHistory(): Promise<{
    migrations: Array<{
      name: string
      appliedAt: Date
      status: string
    }>
  }> {
    try {
      const { stdout } = await execAsync('npx prisma migrate status --json')
      const data = JSON.parse(stdout)
      
      const migrations = data.migrations.map((m: any) => ({
        name: m.migration_name,
        appliedAt: new Date(m.applied_at || Date.now()),
        status: m.status,
      }))

      return { migrations }

    } catch (error) {
      logger.error('Failed to get migration history:', error)
      return { migrations: [] }
    }
  }
}

// Database migration instance
export const dbMigration = new DatabaseMigration()

// Export migration functions
export const migrationUtils = {
  getStatus: () => dbMigration.getStatus(),
  applyMigrations: () => dbMigration.applyMigrations(),
  createMigration: (name: string) => dbMigration.createMigration(name),
  resetDatabase: () => dbMigration.resetDatabase(),
  generateClient: () => dbMigration.generateClient(),
  validateMigrations: () => dbMigration.validateMigrations(),
  getHistory: () => dbMigration.getHistory(),
}




