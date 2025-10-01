#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logger } from '../lib/logger'

interface BackupOptions {
  outputDir?: string
  compress?: boolean
  includeData?: boolean
  includeSchema?: boolean
  tables?: string[]
  excludeTables?: string[]
}

class DatabaseBackup {
  private databaseUrl: string
  private outputDir: string

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || ''
    this.outputDir = process.env.BACKUP_DIR || './backups'
    
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Create backup directory if it doesn't exist
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async createFullBackup(options: BackupOptions = {}): Promise<string> {
    const {
      compress = true,
      includeData = true,
      includeSchema = true,
    } = options

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `full-backup-${timestamp}.sql`
    const filepath = join(this.outputDir, filename)

    logger.info(`Creating full database backup: ${filepath}`)

    try {
      const pgDumpArgs = this.buildPgDumpArgs({
        includeData,
        includeSchema,
        compress,
        outputFile: filepath,
      })

      execSync(`pg_dump ${pgDumpArgs}`, { stdio: 'inherit' })

      if (compress) {
        const compressedFile = `${filepath}.gz`
        execSync(`gzip ${filepath}`)
        logger.info(`Backup compressed: ${compressedFile}`)
        return compressedFile
      }

      logger.info(`Full backup created: ${filepath}`)
      return filepath
    } catch (error) {
      logger.error('Full backup failed:', error)
      throw error
    }
  }

  async createTableBackup(tableName: string, options: BackupOptions = {}): Promise<string> {
    const { compress = true } = options
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `table-${tableName}-${timestamp}.sql`
    const filepath = join(this.outputDir, filename)

    logger.info(`Creating table backup: ${tableName} -> ${filepath}`)

    try {
      const pgDumpArgs = this.buildPgDumpArgs({
        tables: [tableName],
        includeData: true,
        includeSchema: true,
        compress,
        outputFile: filepath,
      })

      execSync(`pg_dump ${pgDumpArgs}`, { stdio: 'inherit' })

      if (compress) {
        const compressedFile = `${filepath}.gz`
        execSync(`gzip ${filepath}`)
        logger.info(`Table backup compressed: ${compressedFile}`)
        return compressedFile
      }

      logger.info(`Table backup created: ${filepath}`)
      return filepath
    } catch (error) {
      logger.error(`Table backup failed for ${tableName}:`, error)
      throw error
    }
  }

  async createDataOnlyBackup(options: BackupOptions = {}): Promise<string> {
    const { compress = true, tables, excludeTables } = options
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `data-only-${timestamp}.sql`
    const filepath = join(this.outputDir, filename)

    logger.info(`Creating data-only backup: ${filepath}`)

    try {
      const pgDumpArgs = this.buildPgDumpArgs({
        includeData: true,
        includeSchema: false,
        compress,
        tables,
        excludeTables,
        outputFile: filepath,
      })

      execSync(`pg_dump ${pgDumpArgs}`, { stdio: 'inherit' })

      if (compress) {
        const compressedFile = `${filepath}.gz`
        execSync(`gzip ${filepath}`)
        logger.info(`Data-only backup compressed: ${compressedFile}`)
        return compressedFile
      }

      logger.info(`Data-only backup created: ${filepath}`)
      return filepath
    } catch (error) {
      logger.error('Data-only backup failed:', error)
      throw error
    }
  }

  async createSchemaOnlyBackup(options: BackupOptions = {}): Promise<string> {
    const { compress = true } = options
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `schema-only-${timestamp}.sql`
    const filepath = join(this.outputDir, filename)

    logger.info(`Creating schema-only backup: ${filepath}`)

    try {
      const pgDumpArgs = this.buildPgDumpArgs({
        includeData: false,
        includeSchema: true,
        compress,
        outputFile: filepath,
      })

      execSync(`pg_dump ${pgDumpArgs}`, { stdio: 'inherit' })

      if (compress) {
        const compressedFile = `${filepath}.gz`
        execSync(`gzip ${filepath}`)
        logger.info(`Schema-only backup compressed: ${compressedFile}`)
        return compressedFile
      }

      logger.info(`Schema-only backup created: ${filepath}`)
      return filepath
    } catch (error) {
      logger.error('Schema-only backup failed:', error)
      throw error
    }
  }

  private buildPgDumpArgs(options: {
    includeData: boolean
    includeSchema: boolean
    compress: boolean
    tables?: string[]
    excludeTables?: string[]
    outputFile: string
  }): string {
    const args: string[] = []

    // Database URL
    args.push(`"${this.databaseUrl}"`)

    // Schema only
    if (options.includeSchema && !options.includeData) {
      args.push('--schema-only')
    }

    // Data only
    if (options.includeData && !options.includeSchema) {
      args.push('--data-only')
    }

    // Specific tables
    if (options.tables && options.tables.length > 0) {
      options.tables.forEach(table => {
        args.push(`--table=${table}`)
      })
    }

    // Exclude tables
    if (options.excludeTables && options.excludeTables.length > 0) {
      options.excludeTables.forEach(table => {
        args.push(`--exclude-table=${table}`)
      })
    }

    // Additional options
    args.push('--verbose')
    args.push('--no-owner')
    args.push('--no-privileges')
    args.push('--clean')
    args.push('--if-exists')

    // Output file
    args.push(`--file=${options.outputFile}`)

    return args.join(' ')
  }

  async listBackups(): Promise<string[]> {
    try {
      const { readdirSync } = await import('fs')
      const files = readdirSync(this.outputDir)
      
      return files
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
    } catch (error) {
      logger.error('Failed to list backups:', error)
      return []
    }
  }

  async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    try {
      const { readdirSync, statSync, unlinkSync } = await import('fs')
      const files = readdirSync(this.outputDir)
      const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
      
      let deletedCount = 0
      for (const file of backupFiles) {
        try {
          const filepath = join(this.outputDir, file)
          const stats = statSync(filepath)
          
          if (stats.birthtime < cutoffDate) {
            unlinkSync(filepath)
            deletedCount++
            logger.info(`Deleted old backup: ${file}`)
          }
        } catch (error) {
          logger.warn(`Failed to delete backup ${file}:`, error)
        }
      }

      logger.info(`Cleanup completed. Deleted ${deletedCount} old backups.`)
      return deletedCount
    } catch (error) {
      logger.error('Backup cleanup failed:', error)
      return 0
    }
  }

  async restoreBackup(backupFile: string, options: { dropExisting?: boolean } = {}): Promise<void> {
    const { dropExisting = false } = options
    const filepath = join(this.outputDir, backupFile)

    if (!existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`)
    }

    logger.info(`Restoring database from backup: ${filepath}`)

    try {
      if (dropExisting) {
        // Drop and recreate database
        const dbName = this.extractDatabaseName()
        execSync(`dropdb --if-exists "${dbName}"`, { stdio: 'inherit' })
        execSync(`createdb "${dbName}"`, { stdio: 'inherit' })
      }

      // Restore from backup
      if (filepath.endsWith('.gz')) {
        execSync(`gunzip -c "${filepath}" | psql "${this.databaseUrl}"`, { stdio: 'inherit' })
      } else {
        execSync(`psql "${this.databaseUrl}" < "${filepath}"`, { stdio: 'inherit' })
      }

      logger.info(`Database restored successfully from: ${backupFile}`)
    } catch (error) {
      logger.error('Database restore failed:', error)
      throw error
    }
  }

  private extractDatabaseName(): string {
    const url = new URL(this.databaseUrl)
    return url.pathname.substring(1) // Remove leading slash
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const backup = new DatabaseBackup()

  try {
    switch (command) {
      case 'full':
        const fullBackup = await backup.createFullBackup()
        console.log(`Full backup created: ${fullBackup}`)
        break

      case 'data':
        const dataBackup = await backup.createDataOnlyBackup()
        console.log(`Data-only backup created: ${dataBackup}`)
        break

      case 'schema':
        const schemaBackup = await backup.createSchemaOnlyBackup()
        console.log(`Schema-only backup created: ${schemaBackup}`)
        break

      case 'table':
        const tableName = process.argv[3]
        if (!tableName) {
          throw new Error('Table name is required for table backup')
        }
        const tableBackup = await backup.createTableBackup(tableName)
        console.log(`Table backup created: ${tableBackup}`)
        break

      case 'list':
        const backups = await backup.listBackups()
        console.log('Available backups:')
        backups.forEach(backup => {
          console.log(`  ${backup}`)
        })
        break

      case 'cleanup':
        const days = parseInt(process.argv[3] || '30')
        const deleted = await backup.cleanupOldBackups(days)
        console.log(`Cleaned up ${deleted} old backups`)
        break

      case 'restore':
        const backupFile = process.argv[3]
        if (!backupFile) {
          throw new Error('Backup file is required for restore')
        }
        const dropExisting = process.argv[4] === '--drop'
        await backup.restoreBackup(backupFile, { dropExisting })
        console.log(`Database restored from: ${backupFile}`)
        break

      default:
        console.log(`
Database Backup Tool

Usage:
  npm run db:backup full                    Create full backup
  npm run db:backup data                    Create data-only backup
  npm run db:backup schema                  Create schema-only backup
  npm run db:backup table <table>           Create table backup
  npm run db:backup list                    List available backups
  npm run db:backup cleanup [days]          Clean up old backups
  npm run db:backup restore <file> [--drop] Restore from backup
        `)
    }
  } catch (error) {
    logger.error('Backup operation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DatabaseBackup }


