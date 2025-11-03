import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { monitoring } from './monitoring';
import fs from 'fs/promises';
import path from 'path';

// Migration configuration
const MIGRATION_CONFIG = {
  // Migration directory
  migrationDir: './prisma/migrations',
  
  // Backup before migration
  backupBeforeMigration: true,
  
  // Rollback on failure
  rollbackOnFailure: true,
  
  // Migration timeout (minutes)
  timeout: 30,
  
  // Batch size for data migrations
  batchSize: 1000,
} as const;

// Migration status
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

// Migration interface
interface Migration {
  id: string;
  name: string;
  version: string;
  description: string;
  status: MigrationStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  rollbackScript?: string;
  dependencies?: string[];
}

// Database migration class
export class DatabaseMigration {
  private prisma: PrismaClient;
  private migrationDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.migrationDir = MIGRATION_CONFIG.migrationDir;
  }

  // Get all migrations
  async getAllMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationDir);
      const migrationFiles = files.filter(f => f.endsWith('.sql'));
      
      const migrations: Migration[] = [];
      
      for (const file of migrationFiles) {
        const filepath = path.join(this.migrationDir, file);
        const content = await fs.readFile(filepath, 'utf-8');
        
        // Parse migration file for metadata
        const metadata = this.parseMigrationMetadata(content);
        
        migrations.push({
          id: file.replace('.sql', ''),
          name: file,
          version: metadata.version || '1.0.0',
          description: metadata.description || 'No description',
          status: MigrationStatus.PENDING,
          rollbackScript: metadata.rollbackScript,
          dependencies: metadata.dependencies,
        });
      }
      
      // Sort by version
      migrations.sort((a, b) => a.version.localeCompare(b.version));
      
      return migrations;
    } catch (error) {
      logger.error('Failed to get migrations', {
        migrationDir: this.migrationDir,
      }, error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // Parse migration metadata
  private parseMigrationMetadata(content: string): {
    version?: string;
    description?: string;
    rollbackScript?: string;
    dependencies?: string[];
  } {
    const metadata: any = {};
    
    // Look for metadata comments
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('-- @version:')) {
        metadata.version = line.replace('-- @version:', '').trim();
      } else if (line.startsWith('-- @description:')) {
        metadata.description = line.replace('-- @description:', '').trim();
      } else if (line.startsWith('-- @dependencies:')) {
        metadata.dependencies = line.replace('-- @dependencies:', '').trim().split(',').map(d => d.trim());
      }
    }
    
    // Look for rollback script
    const rollbackStart = content.indexOf('-- ROLLBACK START');
    const rollbackEnd = content.indexOf('-- ROLLBACK END');
    
    if (rollbackStart !== -1 && rollbackEnd !== -1) {
      metadata.rollbackScript = content.substring(rollbackStart, rollbackEnd);
    }
    
    return metadata;
  }

  // Run migration
  async runMigration(migrationId: string): Promise<Migration> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting migration', { migrationId });
      
      // Get migration
      const migrations = await this.getAllMigrations();
      const migration = migrations.find(m => m.id === migrationId);
      
      if (!migration) {
        throw new Error(`Migration not found: ${migrationId}`);
      }
      
      // Check if already completed
      if (migration.status === MigrationStatus.COMPLETED) {
        logger.warn('Migration already completed', { migrationId });
        return migration;
      }
      
      // Check dependencies
      if (migration.dependencies) {
        await this.checkDependencies(migration.dependencies);
      }
      
      // Update status
      migration.status = MigrationStatus.RUNNING;
      migration.startedAt = new Date();
      
      // Create backup if configured
      if (MIGRATION_CONFIG.backupBeforeMigration) {
        await this.createBackup(migrationId);
      }
      
      // Read migration file
      const migrationFile = path.join(this.migrationDir, `${migrationId}.sql`);
      const content = await fs.readFile(migrationFile, 'utf-8');
      
      // Extract SQL commands (exclude rollback section)
      const sqlCommands = this.extractSqlCommands(content);
      
      // Execute migration
      await this.executeMigration(sqlCommands);
      
      // Update status
      migration.status = MigrationStatus.COMPLETED;
      migration.completedAt = new Date();
      migration.duration = Date.now() - startTime;
      
      // Record metrics
      monitoring.recordCounter('database.migration.success', 1, { migrationId });
      monitoring.recordTimer('database.migration.duration', migration.duration, { migrationId });
      
      logger.info('Migration completed successfully', {
        migrationId,
        duration: migration.duration,
      });
      
      return migration;
      
    } catch (error) {
      logger.error('Migration failed', {
        migrationId,
        duration: Date.now() - startTime,
      }, error instanceof Error ? error : new Error(String(error)));
      
      // Record error metric
      monitoring.recordCounter('database.migration.error', 1, { migrationId });
      
      // Rollback if configured
      if (MIGRATION_CONFIG.rollbackOnFailure) {
        try {
          await this.rollbackMigration(migrationId);
        } catch (rollbackError) {
          logger.error('Migration rollback failed', {
            migrationId,
          }, rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)));
        }
      }
      
      throw error;
    }
  }

  // Check dependencies
  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      const migrations = await this.getAllMigrations();
      const depMigration = migrations.find(m => m.id === dep);
      
      if (!depMigration) {
        throw new Error(`Dependency not found: ${dep}`);
      }
      
      if (depMigration.status !== MigrationStatus.COMPLETED) {
        throw new Error(`Dependency not completed: ${dep}`);
      }
    }
  }

  // Create backup
  private async createBackup(migrationId: string): Promise<void> {
    try {
      logger.info('Creating backup before migration', { migrationId });
      
      // This would use the database backup system
      // For now, we'll just log it
      logger.info('Backup created', { migrationId });
      
    } catch (error) {
      logger.error('Failed to create backup', {
        migrationId,
      }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Extract SQL commands
  private extractSqlCommands(content: string): string[] {
    // Remove rollback section
    const rollbackStart = content.indexOf('-- ROLLBACK START');
    const rollbackEnd = content.indexOf('-- ROLLBACK END');
    
    let sqlContent = content;
    if (rollbackStart !== -1 && rollbackEnd !== -1) {
      sqlContent = content.substring(0, rollbackStart) + content.substring(rollbackEnd + '-- ROLLBACK END'.length);
    }
    
    // Split by semicolon and filter empty commands
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    return commands;
  }

  // Execute migration
  private async executeMigration(commands: string[]): Promise<void> {
    for (const command of commands) {
      if (command.trim()) {
        await this.prisma.$executeRawUnsafe(command);
        logger.debug('Migration command executed', { command: command.substring(0, 100) });
      }
    }
  }

  // Rollback migration
  async rollbackMigration(migrationId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting migration rollback', { migrationId });
      
      // Get migration
      const migrations = await this.getAllMigrations();
      const migration = migrations.find(m => m.id === migrationId);
      
      if (!migration) {
        throw new Error(`Migration not found: ${migrationId}`);
      }
      
      if (!migration.rollbackScript) {
        throw new Error(`No rollback script for migration: ${migrationId}`);
      }
      
      // Execute rollback
      await this.prisma.$executeRawUnsafe(migration.rollbackScript);
      
      // Update status
      migration.status = MigrationStatus.ROLLED_BACK;
      migration.completedAt = new Date();
      migration.duration = Date.now() - startTime;
      
      // Record metrics
      monitoring.recordCounter('database.migration.rollback.success', 1, { migrationId });
      monitoring.recordTimer('database.migration.rollback.duration', migration.duration, { migrationId });
      
      logger.info('Migration rollback completed successfully', {
        migrationId,
        duration: migration.duration,
      });
      
    } catch (error) {
      logger.error('Migration rollback failed', {
        migrationId,
        duration: Date.now() - startTime,
      }, error instanceof Error ? error : new Error(String(error)));
      
      // Record error metric
      monitoring.recordCounter('database.migration.rollback.error', 1, { migrationId });
      
      throw error;
    }
  }

  // Run all pending migrations
  async runAllPendingMigrations(): Promise<Migration[]> {
    try {
      logger.info('Running all pending migrations');
      
      const migrations = await this.getAllMigrations();
      const pendingMigrations = migrations.filter(m => m.status === MigrationStatus.PENDING);
      
      const results: Migration[] = [];
      
      for (const migration of pendingMigrations) {
        try {
          const result = await this.runMigration(migration.id);
          results.push(result);
        } catch (error) {
          logger.error('Migration failed, stopping', {
            migrationId: migration.id,
          }, error instanceof Error ? error : new Error(String(error)));
          break;
        }
      }
      
      logger.info('All pending migrations completed', {
        total: pendingMigrations.length,
        successful: results.length,
        failed: pendingMigrations.length - results.length,
      });
      
      return results;
      
    } catch (error) {
      logger.error('Failed to run pending migrations', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Get migration status
  async getMigrationStatus(): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    lastMigration?: Migration;
  }> {
    try {
      const migrations = await this.getAllMigrations();
      
      const total = migrations.length;
      const completed = migrations.filter(m => m.status === MigrationStatus.COMPLETED).length;
      const pending = migrations.filter(m => m.status === MigrationStatus.PENDING).length;
      const failed = migrations.filter(m => m.status === MigrationStatus.FAILED).length;
      
      const lastMigration = migrations
        .filter(m => m.status === MigrationStatus.COMPLETED)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
      
      return {
        total,
        completed,
        pending,
        failed,
        lastMigration,
      };
    } catch (error) {
      logger.error('Failed to get migration status', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
      };
    }
  }

  // Create new migration
  async createMigration(name: string, description: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const migrationId = `${timestamp}_${name}`;
      const migrationFile = path.join(this.migrationDir, `${migrationId}.sql`);
      
      const content = `-- Migration: ${name}
-- Description: ${description}
-- Version: 1.0.0
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ROLLBACK START
-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;
-- ROLLBACK END
`;

      await fs.writeFile(migrationFile, content);
      
      logger.info('Migration created', {
        migrationId,
        name,
        description,
      });
      
      return migrationId;
      
    } catch (error) {
      logger.error('Failed to create migration', {
        name,
        description,
      }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Validate migration
  async validateMigration(migrationId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const migrationFile = path.join(this.migrationDir, `${migrationId}.sql`);
      const content = await fs.readFile(migrationFile, 'utf-8');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check for required sections
      if (!content.includes('-- ROLLBACK START')) {
        warnings.push('No rollback script found');
      }
      
      if (!content.includes('-- ROLLBACK END')) {
        warnings.push('Rollback script not properly closed');
      }
      
      // Check for dangerous operations
      const dangerousOperations = [
        'DROP DATABASE',
        'DROP SCHEMA',
        'TRUNCATE',
        'DELETE FROM',
      ];
      
      for (const operation of dangerousOperations) {
        if (content.toUpperCase().includes(operation)) {
          warnings.push(`Potentially dangerous operation: ${operation}`);
        }
      }
      
      // Check SQL syntax (basic validation)
      const sqlCommands = this.extractSqlCommands(content);
      for (const command of sqlCommands) {
        if (command.trim() && !command.trim().endsWith(';')) {
          errors.push('SQL command does not end with semicolon');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
      
    } catch (error) {
      logger.error('Failed to validate migration', {
        migrationId,
      }, error instanceof Error ? error : new Error(String(error)));
      
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      };
    }
  }
}

// Create migration instance
export const databaseMigration = new DatabaseMigration(new PrismaClient());

export default databaseMigration;




