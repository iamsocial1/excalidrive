import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Compress JSON data using gzip
 */
export async function compressJSON(data: any): Promise<Buffer> {
  const jsonString = JSON.stringify(data);
  const buffer = Buffer.from(jsonString, 'utf-8');
  return await gzipAsync(buffer);
}

/**
 * Decompress gzipped data to JSON
 */
export async function decompressJSON(compressedData: Buffer): Promise<any> {
  const decompressed = await gunzipAsync(compressedData);
  const jsonString = decompressed.toString('utf-8');
  return JSON.parse(jsonString);
}

/**
 * Check if data should be compressed (only compress if it saves space)
 */
export function shouldCompress(data: any): boolean {
  const jsonString = JSON.stringify(data);
  // Only compress if data is larger than 1KB
  return jsonString.length > 1024;
}
