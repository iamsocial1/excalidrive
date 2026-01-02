import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface StorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
  bucket: string;
}

interface UploadResult {
  key: string;
  url: string;
}

export class StorageService {
  private supabase: SupabaseClient;
  private bucket: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // milliseconds

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    
    // Initialize Supabase client with service role key for backend operations
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Generate a unique file key for a drawing
   */
  private generateDrawingKey(drawingId: string): string {
    return `drawings/${drawingId}/data.json`;
  }

  /**
   * Generate a unique file key for a thumbnail
   */
  private generateThumbnailKey(drawingId: string): string {
    return `drawings/${drawingId}/thumbnail.png`;
  }

  /**
   * Upload drawing JSON data to storage
   */
  async uploadDrawing(drawingId: string, drawingData: any): Promise<UploadResult> {
    const key = this.generateDrawingKey(drawingId);
    const jsonString = JSON.stringify(drawingData);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return this.uploadWithRetry(key, buffer, 'application/json');
  }

  /**
   * Upload thumbnail image to storage
   */
  async uploadThumbnail(drawingId: string, imageData: Buffer | string): Promise<UploadResult> {
    const key = this.generateThumbnailKey(drawingId);
    
    // Handle base64 encoded images
    let buffer: Buffer;
    if (typeof imageData === 'string') {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = imageData;
    }

    return this.uploadWithRetry(key, buffer, 'image/png');
  }

  /**
   * Download drawing data from storage
   */
  async downloadDrawing(drawingId: string): Promise<any> {
    const key = this.generateDrawingKey(drawingId);
    const data = await this.downloadWithRetry(key);
    
    // Parse JSON data
    const jsonString = data.toString('utf-8');
    return JSON.parse(jsonString);
  }

  /**
   * Download thumbnail from storage
   */
  async downloadThumbnail(drawingId: string): Promise<Buffer> {
    const key = this.generateThumbnailKey(drawingId);
    return this.downloadWithRetry(key);
  }

  /**
   * Delete drawing and its thumbnail from storage
   */
  async deleteDrawing(drawingId: string): Promise<void> {
    const drawingKey = this.generateDrawingKey(drawingId);
    const thumbnailKey = this.generateThumbnailKey(drawingId);

    // Delete both files, continue even if one fails
    await Promise.allSettled([
      this.deleteWithRetry(drawingKey),
      this.deleteWithRetry(thumbnailKey),
    ]);
  }

  /**
   * Check if a drawing exists in storage
   */
  async drawingExists(drawingId: string): Promise<boolean> {
    const key = this.generateDrawingKey(drawingId);
    
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(this.getFolder(drawingId), {
          limit: 1,
          search: 'data.json',
        });

      if (error) {
        throw error;
      }

      return data !== null && data.length > 0;
    } catch (error: any) {
      // If the error is a 404 or "not found", return false
      if (error.statusCode === 404 || error.message?.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get folder path for a drawing
   */
  private getFolder(drawingId: string): string {
    return `drawings/${drawingId}`;
  }

  /**
   * Cleanup orphaned files (drawings without database records)
   * This should be called periodically by a background job
   */
  async cleanupOrphanedFiles(validDrawingIds: string[]): Promise<number> {
    // Note: This is a simplified implementation
    // In production, you'd want to list all objects and compare with valid IDs
    // For now, we'll just return 0 as this requires pagination for large datasets
    console.log('Cleanup orphaned files called with', validDrawingIds.length, 'valid IDs');
    return 0;
  }

  /**
   * Upload with retry logic
   */
  private async uploadWithRetry(
    key: string,
    data: Buffer,
    contentType: string
  ): Promise<UploadResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucket)
          .upload(key, data, {
            contentType,
            upsert: true, // Allow overwriting existing files
          });

        if (error) {
          throw error;
        }

        // Generate public URL for the uploaded file
        const { data: urlData } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(key);

        return { 
          key, 
          url: urlData.publicUrl 
        };
      } catch (error: any) {
        lastError = error;
        console.error(`Upload attempt ${attempt} failed for key ${key}:`, error.message);

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to upload file after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Download with retry logic
   */
  private async downloadWithRetry(key: string): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .download(key);

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('No data received from storage');
        }

        // Convert Blob to Buffer
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error: any) {
        lastError = error;
        console.error(`Download attempt ${attempt} failed for key ${key}:`, error.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to download file after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Delete with retry logic
   */
  private async deleteWithRetry(key: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucket)
          .remove([key]);

        if (error) {
          throw error;
        }

        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Delete attempt ${attempt} failed for key ${key}:`, error.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to delete file after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let storageServiceInstance: StorageService | null = null;

/**
 * Initialize the storage service with configuration
 */
export function initializeStorageService(config: StorageConfig): StorageService {
  storageServiceInstance = new StorageService(config);
  return storageServiceInstance;
}

/**
 * Get the storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    throw new Error('Storage service not initialized. Call initializeStorageService first.');
  }
  return storageServiceInstance;
}
