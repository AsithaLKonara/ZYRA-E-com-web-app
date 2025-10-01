import { exec } from 'child_process'
import { promisify } from 'util'
import { config } from './config'
import { logger } from './logger'
import { db } from './db-connection'

const execAsync = promisify(exec)

// Backup configuration
const backupConfig = {
  retentionDays: 30,
  backupPath: './backups',
  maxBackups: 10,
}

// Backup interface
interface BackupInfo {
  filename: string
  size: number
  createdAt: Date
  type: 'full' | 'incremental'
}

// Database backup class
class DatabaseBackup {
  private backups: BackupInfo[] = []

  // Create full backup
  async createFullBackup(): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-full-${timestamp}.sql`
    const filepath = `${backupConfig.backupPath}/${filename}`

    try {
      // Extract database URL components
      const url = new URL(config.database.url)
      const host = url.hostname
      const port = url.port || '5432'
      const database = url.pathname.slice(1)
      const username = url.username
      const password = url.password

      // Create backup directory if it doesn't exist
      await execAsync(`mkdir -p ${backupConfig.backupPath}`)

      // Create backup using pg_dump
      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${filepath}`
      await execAsync(command)

      // Get file size
      const { stdout } = await execAsync(`ls -la ${filepath} | awk '{print $5}'`)
      const size = parseInt(stdout.trim())

      const backupInfo: BackupInfo = {
        filename,
        size,
        createdAt: new Date(),
        type: 'full',
      }

      this.backups.push(backupInfo)
      logger.success(`Full backup created: ${filename} (${size} bytes)`)

      return backupInfo
    } catch (error) {
      logger.error('Failed to create full backup:', error)
      throw error
    }
  }

  // Create incremental backup (only changed data)
  async createIncrementalBackup(): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-incremental-${timestamp}.sql`
    const filepath = `${backupConfig.backupPath}/${filename}`

    try {
      // Get last backup time
      const lastBackup = this.backups
        .filter(b => b.type === 'incremental')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

      const since = lastBackup ? lastBackup.createdAt.toISOString() : '1 day ago'

      // Extract database URL components
      const url = new URL(config.database.url)
      const host = url.hostname
      const port = url.port || '5432'
      const database = url.pathname.slice(1)
      const username = url.username
      const password = url.password

      // Create backup directory if it doesn't exist
      await execAsync(`mkdir -p ${backupConfig.backupPath}`)

      // Create incremental backup
      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --since="${since}" -f ${filepath}`
      await execAsync(command)

      // Get file size
      const { stdout } = await execAsync(`ls -la ${filepath} | awk '{print $5}'`)
      const size = parseInt(stdout.trim())

      const backupInfo: BackupInfo = {
        filename,
        size,
        createdAt: new Date(),
        type: 'incremental',
      }

      this.backups.push(backupInfo)
      logger.success(`Incremental backup created: ${filename} (${size} bytes)`)

      return backupInfo
    } catch (error) {
      logger.error('Failed to create incremental backup:', error)
      throw error
    }
  }

  // Restore from backup
  async restoreFromBackup(filename: string): Promise<void> {
    const filepath = `${backupConfig.backupPath}/${filename}`

    try {
      // Extract database URL components
      const url = new URL(config.database.url)
      const host = url.hostname
      const port = url.port || '5432'
      const database = url.pathname.slice(1)
      const username = url.username
      const password = url.password

      // Restore from backup
      const command = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${filepath}`
      await execAsync(command)

      logger.success(`Database restored from backup: ${filename}`)
    } catch (error) {
      logger.error('Failed to restore from backup:', error)
      throw error
    }
  }

  // List available backups
  listBackups(): BackupInfo[] {
    return [...this.backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Clean up old backups
  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - backupConfig.retentionDays)

    const oldBackups = this.backups.filter(backup => backup.createdAt < cutoffDate)
    
    for (const backup of oldBackups) {
      try {
        await execAsync(`rm ${backupConfig.backupPath}/${backup.filename}`)
        this.backups = this.backups.filter(b => b.filename !== backup.filename)
        logger.info(`Deleted old backup: ${backup.filename}`)
      } catch (error) {
        logger.error(`Failed to delete backup ${backup.filename}:`, error)
      }
    }

    // Keep only the most recent backups
    if (this.backups.length > backupConfig.maxBackups) {
      const sortedBackups = this.backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const toDelete = sortedBackups.slice(backupConfig.maxBackups)
      
      for (const backup of toDelete) {
        try {
          await execAsync(`rm ${backupConfig.backupPath}/${backup.filename}`)
          this.backups = this.backups.filter(b => b.filename !== backup.filename)
          logger.info(`Deleted excess backup: ${backup.filename}`)
        } catch (error) {
          logger.error(`Failed to delete backup ${backup.filename}:`, error)
        }
      }
    }
  }

  // Get backup stats
  getStats() {
    const totalSize = this.backups.reduce((sum, backup) => sum + backup.size, 0)
    const fullBackups = this.backups.filter(b => b.type === 'full').length
    const incrementalBackups = this.backups.filter(b => b.type === 'incremental').length

    return {
      totalBackups: this.backups.length,
      fullBackups,
      incrementalBackups,
      totalSize,
      averageSize: this.backups.length > 0 ? totalSize / this.backups.length : 0,
    }
  }
}

// Backup instance
export const dbBackup = new DatabaseBackup()

// Schedule automatic backups
export function scheduleBackups() {
  // Full backup every day at 2 AM
  const fullBackupInterval = setInterval(async () => {
    try {
      await dbBackup.createFullBackup()
      await dbBackup.cleanupOldBackups()
    } catch (error) {
      logger.error('Scheduled full backup failed:', error)
    }
  }, 24 * 60 * 60 * 1000) // 24 hours

  // Incremental backup every 6 hours
  const incrementalBackupInterval = setInterval(async () => {
    try {
      await dbBackup.createIncrementalBackup()
    } catch (error) {
      logger.error('Scheduled incremental backup failed:', error)
    }
  }, 6 * 60 * 60 * 1000) // 6 hours

  // Cleanup every hour
  const cleanupInterval = setInterval(async () => {
    try {
      await dbBackup.cleanupOldBackups()
    } catch (error) {
      logger.error('Scheduled cleanup failed:', error)
    }
  }, 60 * 60 * 1000) // 1 hour

  return {
    fullBackupInterval,
    incrementalBackupInterval,
    cleanupInterval,
  }
}

// Export backup functions
export const backupUtils = {
  createFullBackup: () => dbBackup.createFullBackup(),
  createIncrementalBackup: () => dbBackup.createIncrementalBackup(),
  restoreFromBackup: (filename: string) => dbBackup.restoreFromBackup(filename),
  listBackups: () => dbBackup.listBackups(),
  cleanupOldBackups: () => dbBackup.cleanupOldBackups(),
  getStats: () => dbBackup.getStats(),
}




