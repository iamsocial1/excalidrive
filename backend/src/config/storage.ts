import { config } from 'dotenv';

config();

export const storageConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  bucket: process.env.SUPABASE_STORAGE_BUCKET || 'excalidraw-drawings',
};

// Validate required configuration
export function validateStorageConfig(): void {
  const required = ['supabaseUrl', 'supabaseKey', 'bucket'];
  const missing = required.filter((key) => !storageConfig[key as keyof typeof storageConfig]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required storage configuration: ${missing.join(', ')}. ` +
      'Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET environment variables.'
    );
  }
}
