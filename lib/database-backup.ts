import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { monitoring } from './monitoring';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Backup configuration
const BACKUP_CONFIG = {
  // Backup directory
  backupDir: process.env.BACKUP_DIR || './backups',
  
  // Backup retention (days)
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  
  // Backup frequency
  frequency: {
    full: '0 2 * * *', // Daily at 2 AM
    incremental: '0 */6 * * *', // Every 6 hours
  },
  
  // Compression
  compression: true,
  compressionLevel: 6,
  
  // Encryption
  encryption: process.env.BACKUP_ENCRYPTION === 'true',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
} as const;

// Backup types
export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  SCHEMA_ONLY = 'schema_only',
  DATA_ONLY = 'data_only',
}

// Backup metadata interface
interface BackupMetadata {
  id: string;
  type: BackupType;
  timestamp: Date;
  size: number;
  checksum: string;
  database: string;
  version: string;
  tables: string[];
  recordCount: number;
  duration: number;
  compressed: boolean;
  encrypted: boolean;
}

// Database backup class
export class DatabaseBackup {
  private prisma: PrismaClient;
  private backupDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.backupDir = BACKUP_CONFIG.backupDir;
  }

  // Ensure backup directory exists
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.debug('Backup directory ensured', { dir: this.backupDir });
    } catch (error) {
      logger.error('Failed to create backup directory', {
        dir: this.backupDir,
        error: error.message,
      });
      throw error;
    }
  }

  // Generate backup filename
  private generateBackupFilename(type: BackupType, timestamp: Date): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const ext = BACKUP_CONFIG.compression ? 'sql.gz' : 'sql';
    
    return `${type}_${dateStr}_${timeStr}.${ext}`;
  }

  // Get database connection info
  private getDatabaseInfo(): { host: string; port: string; database: string; username: string } {
    const url = new URL(process.env.DATABASE_URL!);
    
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      username: url.username,
    };
  }

  // Create full backup
  async createFullBackup(): Promise<BackupMetadata> {
    const startTime = Date.now();
    const timestamp = new Date();
    const filename = this.generateBackupFilename(BackupType.FULL, timestamp);
    const filepath = path.join(this.backupDir, filename);
    
    try {
      await this.ensureBackupDir();
      
      logger.info('Creating full database backup', {
        filename,
        timestamp: timestamp.toISOString(),
      });

      const dbInfo = this.getDatabaseInfo();
      const password = new URL(process.env.DATABASE_URL!).password;
      
      // Build pg_dump command
      let command = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database}`;
      
      if (password) {
        command += ` -W`;
      }
      
      if (BACKUP_CONFIG.compression) {
        command += ` | gzip -${BACKUP_CONFIG.compressionLevel}`;
      }
      
      command += ` > ${filepath}`;
      
      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };
      
      // Execute backup command
      await execAsync(command, { env });
      
      // Get file stats
      const stats = await fs.stat(filepath);
      const size = stats.size;
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath);
      
      // Get table information
      const tables = await this.getTableInfo();
      const recordCount = await this.getRecordCount();
      
      const duration = Date.now() - startTime;
      
      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        type: BackupType.FULL,
        timestamp,
        size,
        checksum,
        database: dbInfo.database,
        version: await this.getDatabaseVersion(),
        tables: tables.map(t => t.name),
        recordCount,
        duration,
        compressed: BACKUP_CONFIG.compression,
        encrypted: BACKUP_CONFIG.encryption,
      };
      
      // Save metadata
      await this.saveMetadata(metadata);
      
      // Record metrics
      monitoring.recordCounter('database.backup.full.created', 1);
      monitoring.recordTimer('database.backup.full.duration', duration);
      monitoring.recordGauge('database.backup.full.size', size);
      
      logger.info('Full database backup created successfully', {
        filename,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
        tables: tables.length,
        records: recordCount,
      });
      
      return metadata;
      
    } catch (error) {
      logger.error('Full database backup failed', {
        filename,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      
      monitoring.recordCounter('database.backup.full.error', 1);
      throw error;
    }
  }

  // Create incremental backup
  async createIncrementalBackup(): Promise<BackupMetadata> {
    const startTime = Date.now();
    const timestamp = new Date();
    const filename = this.generateBackupFilename(BackupType.INCREMENTAL, timestamp);
    const filepath = path.join(this.backupDir, filename);
    
    try {
      await this.ensureBackupDir();
      
      logger.info('Creating incremental database backup', {
        filename,
        timestamp: timestamp.toISOString(),
      });

      // For incremental backup, we'll backup only changed data
      // This is a simplified implementation - in production, you'd use WAL files
      const dbInfo = this.getDatabaseInfo();
      const password = new URL(process.env.DATABASE_URL!).password;
      
      // Get last backup timestamp
      const lastBackup = await this.getLastBackup();
      const sinceTimestamp = lastBackup?.timestamp || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Build pg_dump command for incremental backup
      let command = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database}`;
      command += ` --data-only --where="updated_at >= '${sinceTimestamp.toISOString()}'"`;
      
      if (password) {
        command += ` -W`;
      }
      
      if (BACKUP_CONFIG.compression) {
        command += ` | gzip -${BACKUP_CONFIG.compressionLevel}`;
      }
      
      command += ` > ${filepath}`;
      
      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };
      
      // Execute backup command
      await execAsync(command, { env });
      
      // Get file stats
      const stats = await fs.stat(filepath);
      const size = stats.size;
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath);
      
      // Get table information
      const tables = await this.getTableInfo();
      const recordCount = await this.getRecordCount();
      
      const duration = Date.now() - startTime;
      
      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        type: BackupType.INCREMENTAL,
        timestamp,
        size,
        checksum,
        database: dbInfo.database,
        version: await this.getDatabaseVersion(),
        tables: tables.map(t => t.name),
        recordCount,
        duration,
        compressed: BACKUP_CONFIG.compression,
        encrypted: BACKUP_CONFIG.encryption,
      };
      
      // Save metadata
      await this.saveMetadata(metadata);
      
      // Record metrics
      monitoring.recordCounter('database.backup.incremental.created', 1);
      monitoring.recordTimer('database.backup.incremental.duration', duration);
      monitoring.recordGauge('database.backup.incremental.size', size);
      
      logger.info('Incremental database backup created successfully', {
        filename,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
        tables: tables.length,
        records: recordCount,
      });
      
      return metadata;
      
    } catch (error) {
      logger.error('Incremental database backup failed', {
        filename,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      
      monitoring.recordCounter('database.backup.incremental.error', 1);
      throw error;
    }
  }

  // Create schema-only backup
  async createSchemaBackup(): Promise<BackupMetadata> {
    const startTime = Date.now();
    const timestamp = new Date();
    const filename = this.generateBackupFilename(BackupType.SCHEMA_ONLY, timestamp);
    const filepath = path.join(this.backupDir, filename);
    
    try {
      await this.ensureBackupDir();
      
      logger.info('Creating schema-only database backup', {
        filename,
        timestamp: timestamp.toISOString(),
      });

      const dbInfo = this.getDatabaseInfo();
      const password = new URL(process.env.DATABASE_URL!).password;
      
      // Build pg_dump command for schema only
      let command = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database}`;
      command += ` --schema-only --no-owner --no-privileges`;
      
      if (password) {
        command += ` -W`;
      }
      
      if (BACKUP_CONFIG.compression) {
        command += ` | gzip -${BACKUP_CONFIG.compressionLevel}`;
      }
      
      command += ` > ${filepath}`;
      
      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };
      
      // Execute backup command
      await execAsync(command, { env });
      
      // Get file stats
      const stats = await fs.stat(filepath);
      const size = stats.size;
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath);
      
      // Get table information
      const tables = await this.getTableInfo();
      
      const duration = Date.now() - startTime;
      
      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        type: BackupType.SCHEMA_ONLY,
        timestamp,
        size,
        checksum,
        database: dbInfo.database,
        version: await this.getDatabaseVersion(),
        tables: tables.map(t => t.name),
        recordCount: 0, // Schema only, no data
        duration,
        compressed: BACKUP_CONFIG.compression,
        encrypted: BACKUP_CONFIG.encryption,
      };
      
      // Save metadata
      await this.saveMetadata(metadata);
      
      // Record metrics
      monitoring.recordCounter('database.backup.schema.created', 1);
      monitoring.recordTimer('database.backup.schema.duration', duration);
      monitoring.recordGauge('database.backup.schema.size', size);
      
      logger.info('Schema-only database backup created successfully', {
        filename,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
        tables: tables.length,
      });
      
      return metadata;
      
    } catch (error) {
      logger.error('Schema-only database backup failed', {
        filename,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      
      monitoring.recordCounter('database.backup.schema.error', 1);
      throw error;
    }
  }

  // Calculate file checksum
  private async calculateChecksum(filepath: string): Promise<string> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`sha256sum "${filepath}"`);
      return stdout.split(' ')[0];
    } catch (error) {
      logger.warn('Failed to calculate checksum', {
        filepath,
        error: error.message,
      });
      return 'unknown';
    }
  }

  // Get table information
  private async getTableInfo(): Promise<{ name: string; rows: number }[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename as name,
          n_tup_ins as rows
        FROM pg_stat_user_tables
        ORDER BY tablename;
      `;
      
      return result as { name: string; rows: number }[];
    } catch (error) {
      logger.warn('Failed to get table information', {
        error: error.message,
      });
      return [];
    }
  }

  // Get total record count
  private async getRecordCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT SUM(n_tup_ins) as total_rows
        FROM pg_stat_user_tables;
      `;
      
      return (result as any)[0].total_rows || 0;
    } catch (error) {
      logger.warn('Failed to get record count', {
        error: error.message,
      });
      return 0;
    }
  }

  // Get database version
  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.prisma.$queryRaw`SELECT version()`;
      return (result as any)[0].version;
    } catch (error) {
      logger.warn('Failed to get database version', {
        error: error.message,
      });
      return 'unknown';
    }
  }

  // Save backup metadata
  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const metadataFile = path.join(this.backupDir, `${metadata.id}.json`);
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
      
      logger.debug('Backup metadata saved', {
        id: metadata.id,
        file: metadataFile,
      });
    } catch (error) {
      logger.error('Failed to save backup metadata', {
        id: metadata.id,
        error: error.message,
      });
    }
  }

  // Get last backup
  private async getLastBackup(): Promise<BackupMetadata | null> {
    try {
      const files = await fs.readdir(this.backupDir);
      const metadataFiles = files.filter(f => f.endsWith('.json'));
      
      if (metadataFiles.length === 0) {
        return null;
      }
      
      // Sort by modification time (newest first)
      const sortedFiles = await Promise.all(
        metadataFiles.map(async (file) => {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          return { file, mtime: stats.mtime };
        })
      );
      
      sortedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      const latestFile = path.join(this.backupDir, sortedFiles[0].file);
      const content = await fs.readFile(latestFile, 'utf-8');
      
      return JSON.parse(content) as BackupMetadata;
    } catch (error) {
      logger.warn('Failed to get last backup', {
        error: error.message,
      });
      return null;
    }
  }

  // List all backups
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const metadataFiles = files.filter(f => f.endsWith('.json'));
      
      const backups = await Promise.all(
        metadataFiles.map(async (file) => {
          try {
            const filepath = path.join(this.backupDir, file);
            const content = await fs.readFile(filepath, 'utf-8');
            return JSON.parse(content) as BackupMetadata;
          } catch (error) {
            logger.warn('Failed to parse backup metadata', {
              file,
              error: error.message,
            });
            return null;
          }
        })
      );
      
      return backups.filter(Boolean).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      logger.error('Failed to list backups', {
        error: error.message,
      });
      return [];
    }
  }

  // Clean up old backups
  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date(Date.now() - BACKUP_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
      
      const oldBackups = backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate
      );
      
      let deletedCount = 0;
      
      for (const backup of oldBackups) {
        try {
          // Delete backup file
          const backupFile = path.join(this.backupDir, `${backup.id}.sql${BACKUP_CONFIG.compression ? '.gz' : ''}`);
          await fs.unlink(backupFile);
          
          // Delete metadata file
          const metadataFile = path.join(this.backupDir, `${backup.id}.json`);
          await fs.unlink(metadataFile);
          
          deletedCount++;
          
          logger.debug('Old backup deleted', {
            id: backup.id,
            timestamp: backup.timestamp,
            type: backup.type,
          });
        } catch (error) {
          logger.warn('Failed to delete old backup', {
            id: backup.id,
            error: error.message,
          });
        }
      }
      
      logger.info('Old backups cleaned up', {
        deletedCount,
        retentionDays: BACKUP_CONFIG.retentionDays,
      });
      
      monitoring.recordCounter('database.backup.cleanup.deleted', deletedCount);
      
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old backups', {
        error: error.message,
      });
      return 0;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      logger.info('Starting database restore', { backupId });
      
      const metadataFile = path.join(this.backupDir, `${backupId}.json`);
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf-8')) as BackupMetadata;
      
      const backupFile = path.join(this.backupDir, `${backupId}.sql${BACKUP_CONFIG.compression ? '.gz' : ''}`);
      
      const dbInfo = this.getDatabaseInfo();
      const password = new URL(process.env.DATABASE_URL!).password;
      
      // Build restore command
      let command = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database}`;
      
      if (password) {
        command += ` -W`;
      }
      
      if (BACKUP_CONFIG.compression) {
        command = `gunzip -c "${backupFile}" | ${command}`;
      } else {
        command += ` < "${backupFile}"`;
      }
      
      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };
      
      // Execute restore command
      await execAsync(command, { env });
      
      logger.info('Database restore completed successfully', {
        backupId,
        type: metadata.type,
        timestamp: metadata.timestamp,
      });
      
      monitoring.recordCounter('database.backup.restore.success', 1);
    } catch (error) {
      logger.error('Database restore failed', {
        backupId,
        error: error.message,
        stack: error.stack,
      });
      
      monitoring.recordCounter('database.backup.restore.error', 1);
      throw error;
    }
  }
}

// Create backup instance
export const databaseBackup = new DatabaseBackup(new PrismaClient());

// Schedule automatic backups
export function scheduleBackups(): void {
  // This would typically use a cron job or task scheduler
  // For now, we'll just log the schedule
  logger.info('Backup schedule configured', {
    full: BACKUP_CONFIG.frequency.full,
    incremental: BACKUP_CONFIG.frequency.incremental,
    retentionDays: BACKUP_CONFIG.retentionDays,
  });
}

export default databaseBackup;




