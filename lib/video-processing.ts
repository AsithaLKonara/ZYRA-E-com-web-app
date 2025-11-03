import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { logger } from './logger';

export interface VideoProcessingOptions {
  inputPath: string;
  outputPath?: string;
  outputDir?: string;
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm' | 'mov';
  thumbnail?: boolean;
  generateThumbnails?: boolean;
  generateMultipleResolutions?: boolean;
  duration?: number;
  startTime?: number;
  endTime?: number;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fontSize?: number;
    color?: string;
  };
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  format: string;
  size: number;
  fileSize: number;
}

export interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  processedPath?: string;
  thumbnailPath?: string;
  metadata?: VideoMetadata;
  error?: string;
  processingTime: number;
}

export class VideoProcessor {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    // In production, these should be configured via environment variables
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    this.ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  }

  /**
   * Get video metadata using ffprobe
   */
  async getMetadata(inputPath: string): Promise<VideoMetadata> {
    const command = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ];

    try {
      const result = await this.executeCommand(this.ffprobePath, command);
      const data = JSON.parse(result);

      const videoStream = data.streams.find((stream: any) => stream.codec_type === 'video');
      const format = data.format;

      return {
        duration: parseFloat(format.duration),
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate), // Convert fraction to decimal
        bitrate: parseInt(format.bit_rate),
        codec: videoStream.codec_name,
        format: format.format_name,
        size: parseInt(format.size)
      };
    } catch (error) {
      throw new Error(`Failed to get video metadata: ${error}`);
    }
  }

  /**
   * Process video with various options
   */
  async processVideo(options: VideoProcessingOptions): Promise<ProcessingResult> {
    const startTime = Date.now();
    const outputPath = options.outputPath || this.generateTempPath(options.format || 'mp4');
    
    try {
      const command = this.buildFFmpegCommand(options, outputPath);
      
      // Execute FFmpeg command
      await this.executeCommand(this.ffmpegPath, command);
      
      // Generate thumbnail if requested
      let thumbnailPath: string | undefined;
      if (options.thumbnail) {
        thumbnailPath = await this.generateThumbnail(options.inputPath, outputPath);
      }
      
      // Get output metadata
      const metadata = await this.getMetadata(outputPath);
      
      return {
        success: true,
        outputPath,
        thumbnailPath,
        metadata,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(inputPath: string, outputPath: string, timeOffset: number = 1): Promise<string> {
    const thumbnailPath = outputPath.replace(/\.[^/.]+$/, '_thumb.jpg');
    
    const command = [
      '-i', inputPath,
      '-ss', timeOffset.toString(),
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      thumbnailPath
    ];

    await this.executeCommand(this.ffmpegPath, command);
    return thumbnailPath;
  }

  /**
   * Compress video for web delivery
   */
  async compressVideo(inputPath: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<ProcessingResult> {
    const qualitySettings = {
      low: { crf: 28, preset: 'fast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' }
    };

    const settings = qualitySettings[quality];
    const outputPath = this.generateTempPath('mp4');

    const options: VideoProcessingOptions = {
      inputPath,
      outputPath,
      quality,
      format: 'mp4'
    };

    return this.processVideo(options);
  }

  /**
   * Convert video format
   */
  async convertFormat(inputPath: string, format: 'mp4' | 'webm' | 'mov'): Promise<ProcessingResult> {
    const outputPath = this.generateTempPath(format);
    
    const options: VideoProcessingOptions = {
      inputPath,
      outputPath,
      format
    };

    return this.processVideo(options);
  }

  /**
   * Extract video segment
   */
  async extractSegment(
    inputPath: string, 
    startTime: number, 
    duration: number, 
    outputPath?: string
  ): Promise<ProcessingResult> {
    const finalOutputPath = outputPath || this.generateTempPath('mp4');
    
    const options: VideoProcessingOptions = {
      inputPath,
      outputPath: finalOutputPath,
      startTime,
      duration
    };

    return this.processVideo(options);
  }

  /**
   * Add watermark to video
   */
  async addWatermark(
    inputPath: string, 
    watermark: VideoProcessingOptions['watermark'],
    outputPath?: string
  ): Promise<ProcessingResult> {
    const finalOutputPath = outputPath || this.generateTempPath('mp4');
    
    const options: VideoProcessingOptions = {
      inputPath,
      outputPath: finalOutputPath,
      watermark
    };

    return this.processVideo(options);
  }

  /**
   * Apply video filters
   */
  async applyFilters(
    inputPath: string, 
    filters: VideoProcessingOptions['filters'],
    outputPath?: string
  ): Promise<ProcessingResult> {
    const finalOutputPath = outputPath || this.generateTempPath('mp4');
    
    const options: VideoProcessingOptions = {
      inputPath,
      outputPath: finalOutputPath,
      filters
    };

    return this.processVideo(options);
  }

  /**
   * Build FFmpeg command based on options
   */
  private buildFFmpegCommand(options: VideoProcessingOptions, outputPath: string): string[] {
    const command: string[] = ['-i', options.inputPath];

    // Input options
    if (options.startTime !== undefined) {
      command.push('-ss', options.startTime.toString());
    }

    // Video filters
    const filters: string[] = [];
    
    if (options.filters) {
      if (options.filters.brightness !== undefined) {
        filters.push(`eq=brightness=${options.filters.brightness}`);
      }
      if (options.filters.contrast !== undefined) {
        filters.push(`eq=contrast=${options.filters.contrast}`);
      }
      if (options.filters.saturation !== undefined) {
        filters.push(`eq=saturation=${options.filters.saturation}`);
      }
      if (options.filters.blur !== undefined) {
        filters.push(`gblur=sigma=${options.filters.blur}`);
      }
    }

    // Watermark
    if (options.watermark) {
      const { text, position, fontSize = 24, color = 'white' } = options.watermark;
      const positionMap = {
        'top-left': '10:10',
        'top-right': 'W-tw-10:10',
        'bottom-left': '10:H-th-10',
        'bottom-right': 'W-tw-10:H-th-10'
      };
      
      filters.push(`drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${color}:x=${positionMap[position]}`);
    }

    if (filters.length > 0) {
      command.push('-vf', filters.join(','));
    }

    // Output options
    if (options.duration) {
      command.push('-t', options.duration.toString());
    }

    // Quality settings
    if (options.quality) {
      const qualitySettings = {
        low: { crf: 28, preset: 'fast' },
        medium: { crf: 23, preset: 'medium' },
        high: { crf: 18, preset: 'slow' }
      };
      
      const settings = qualitySettings[options.quality];
      command.push('-crf', settings.crf.toString());
      command.push('-preset', settings.preset);
    }

    // Format
    if (options.format === 'webm') {
      command.push('-c:v', 'libvpx-vp9');
      command.push('-c:a', 'libopus');
    } else if (options.format === 'mov') {
      command.push('-c:v', 'libx264');
      command.push('-c:a', 'aac');
    } else {
      command.push('-c:v', 'libx264');
      command.push('-c:a', 'aac');
    }

    command.push('-y', outputPath);
    return command;
  }

  /**
   * Execute command and return output
   */
  private executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${error}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate temporary file path
   */
  private generateTempPath(format: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return join(tmpdir(), `video_${timestamp}_${random}.${format}`);
  }

  /**
   * Clean up temporary files
   */
  async cleanup(files: string[]): Promise<void> {
    const unlinkAsync = promisify(unlink);
    
    for (const file of files) {
      try {
        await unlinkAsync(file);
      } catch (error) {
        logger.warn(`Failed to delete temporary file`, { file }, error instanceof Error ? error : undefined);
      }
    }
  }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor();