import Queue from 'bull';
import { logger } from './logger';
import { monitoring } from './monitoring';

// Queue configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Job types
export enum JobType {
  VIDEO_PROCESSING = 'video-processing',
  EMAIL_SEND = 'email-send',
  IMAGE_RESIZE = 'image-resize',
  DATA_EXPORT = 'data-export',
  CLEANUP = 'cleanup',
  ANALYTICS = 'analytics'
}

// Job data interfaces
export interface VideoProcessingJobData {
  inputUrl: string;
  outputUrl: string;
  options: {
    quality: 'low' | 'medium' | 'high';
    format: 'mp4' | 'webm' | 'mov';
    thumbnail: boolean;
    watermark?: {
      text: string;
      position: string;
    };
  };
  userId: string;
  metadata?: any;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
}

export interface ImageResizeJobData {
  inputUrl: string;
  outputUrl: string;
  sizes: Array<{
    width: number;
    height: number;
    quality: number;
  }>;
  format: 'jpeg' | 'png' | 'webp';
}

export interface DataExportJobData {
  userId: string;
  format: 'csv' | 'json' | 'xlsx';
  filters: Record<string, any>;
  email?: string;
}

export interface CleanupJobData {
  type: 'temp-files' | 'old-sessions' | 'expired-tokens';
  olderThan: Date;
  batchSize: number;
}

export interface AnalyticsJobData {
  event: string;
  data: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

// Queue instances
const queues = {
  [JobType.VIDEO_PROCESSING]: new Queue<VideoProcessingJobData>(JobType.VIDEO_PROCESSING, REDIS_URL),
  [JobType.EMAIL_SEND]: new Queue<EmailJobData>(JobType.EMAIL_SEND, REDIS_URL),
  [JobType.IMAGE_RESIZE]: new Queue<ImageResizeJobData>(JobType.IMAGE_RESIZE, REDIS_URL),
  [JobType.DATA_EXPORT]: new Queue<DataExportJobData>(JobType.DATA_EXPORT, REDIS_URL),
  [JobType.CLEANUP]: new Queue<CleanupJobData>(JobType.CLEANUP, REDIS_URL),
  [JobType.ANALYTICS]: new Queue<AnalyticsJobData>(JobType.ANALYTICS, REDIS_URL)
};

// Queue configuration
Object.values(queues).forEach(queue => {
  // Set default job options
  queue.defaultJobOptions = {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  };

  // Error handling
  queue.on('error', (error) => {
    logger.error('Queue error', { error: error.message, stack: error.stack });
    monitoring.recordMetric('queue_error', 1);
  });

  // Job completion
  queue.on('completed', (job) => {
    logger.info('Job completed', { 
      jobId: job.id, 
      jobType: job.name,
      duration: Date.now() - job.timestamp
    });
    monitoring.recordMetric('job_completed', 1, { job_type: job.name });
  });

  // Job failure
  queue.on('failed', (job, error) => {
    logger.error('Job failed', { 
      jobId: job.id, 
      jobType: job.name,
      error: error.message,
      attempts: job.attemptsMade
    });
    monitoring.recordMetric('job_failed', 1, { job_type: job.name });
  });

  // Job stalled
  queue.on('stalled', (job) => {
    logger.warn('Job stalled', { jobId: job.id, jobType: job.name });
    monitoring.recordMetric('job_stalled', 1, { job_type: job.name });
  });
});

// Queue management functions
export class QueueManager {
  /**
   * Add job to queue
   */
  static async addJob<T extends JobType>(
    jobType: T,
    data: T extends JobType.VIDEO_PROCESSING ? VideoProcessingJobData :
          T extends JobType.EMAIL_SEND ? EmailJobData :
          T extends JobType.IMAGE_RESIZE ? ImageResizeJobData :
          T extends JobType.DATA_EXPORT ? DataExportJobData :
          T extends JobType.CLEANUP ? CleanupJobData :
          T extends JobType.ANALYTICS ? AnalyticsJobData : never,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
      removeOnComplete?: number;
      removeOnFail?: number;
    }
  ) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    const jobOptions = {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      removeOnComplete: options?.removeOnComplete || 100,
      removeOnFail: options?.removeOnFail || 50
    };

    const job = await queue.add(data, jobOptions);
    
    logger.info('Job added to queue', {
      jobId: job.id,
      jobType,
      priority: jobOptions.priority,
      delay: jobOptions.delay
    });

    monitoring.recordMetric('job_added', 1, { job_type: jobType });

    return job;
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobType: JobType, jobId: string) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      type: jobType,
      state,
      progress,
      result,
      failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      attempts: job.attemptsMade,
      data: job.data
    };
  }

  /**
   * Cancel job
   */
  static async cancelJob(jobType: JobType, jobId: string) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    
    logger.info('Job cancelled', { jobId, jobType });
    monitoring.recordMetric('job_cancelled', 1, { job_type: jobType });
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(jobType: JobType) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    const delayed = await queue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  /**
   * Get all queue statistics
   */
  static async getAllQueueStats() {
    const stats: Record<string, any> = {};
    
    for (const [jobType, queue] of Object.entries(queues)) {
      stats[jobType] = await this.getQueueStats(jobType as JobType);
    }

    return stats;
  }

  /**
   * Clean old jobs
   */
  static async cleanOldJobs(jobType: JobType, grace: number = 24 * 60 * 60 * 1000) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    
    const oldCompleted = completed.filter(job => 
      Date.now() - job.finishedOn! > grace
    );
    
    const oldFailed = failed.filter(job => 
      Date.now() - job.finishedOn! > grace
    );

    await Promise.all([
      ...oldCompleted.map(job => job.remove()),
      ...oldFailed.map(job => job.remove())
    ]);

    logger.info('Old jobs cleaned', {
      jobType,
      completed: oldCompleted.length,
      failed: oldFailed.length
    });

    return {
      completed: oldCompleted.length,
      failed: oldFailed.length
    };
  }

  /**
   * Pause queue
   */
  static async pauseQueue(jobType: JobType) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    await queue.pause();
    logger.info('Queue paused', { jobType });
  }

  /**
   * Resume queue
   */
  static async resumeQueue(jobType: JobType) {
    const queue = queues[jobType];
    if (!queue) {
      throw new Error(`Queue ${jobType} not found`);
    }

    await queue.resume();
    logger.info('Queue resumed', { jobType });
  }

  /**
   * Close all queues
   */
  static async closeAllQueues() {
    await Promise.all(
      Object.values(queues).map(queue => queue.close())
    );
    logger.info('All queues closed');
  }
}

// Export queues for worker processes
export { queues };

// Export default instance
export default QueueManager;


