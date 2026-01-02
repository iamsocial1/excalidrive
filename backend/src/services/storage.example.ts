/**
 * Example usage of the Storage Service
 * 
 * This file demonstrates how to use the storage service for managing
 * Excalidraw drawings and thumbnails.
 */

import { getStorageService } from './storage.service';

// Example drawing data (simplified Excalidraw format)
const exampleDrawingData = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements: [
    {
      type: 'rectangle',
      version: 1,
      versionNonce: 123456,
      isDeleted: false,
      id: 'rect-1',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      angle: 0,
      x: 100,
      y: 100,
      strokeColor: '#000000',
      backgroundColor: '#ffffff',
      width: 200,
      height: 150,
      seed: 123456,
      groupIds: [],
      frameId: null,
      roundness: null,
      boundElements: [],
      updated: 1,
      link: null,
      locked: false,
    },
  ],
  appState: {
    gridSize: null,
    viewBackgroundColor: '#ffffff',
  },
  files: {},
};

// Example base64 thumbnail (1x1 transparent PNG)
const exampleThumbnail = 
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Example: Upload a drawing and thumbnail
 */
export async function exampleUpload(drawingId: string): Promise<void> {
  const storageService = getStorageService();

  try {
    console.log(`Uploading drawing ${drawingId}...`);

    // Upload drawing data
    const drawingResult = await storageService.uploadDrawing(
      drawingId,
      exampleDrawingData
    );
    console.log('Drawing uploaded:', drawingResult);

    // Upload thumbnail
    const thumbnailResult = await storageService.uploadThumbnail(
      drawingId,
      exampleThumbnail
    );
    console.log('Thumbnail uploaded:', thumbnailResult);

    console.log('Upload complete!');
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Example: Download a drawing and thumbnail
 */
export async function exampleDownload(drawingId: string): Promise<void> {
  const storageService = getStorageService();

  try {
    console.log(`Downloading drawing ${drawingId}...`);

    // Check if drawing exists
    const exists = await storageService.drawingExists(drawingId);
    if (!exists) {
      console.log('Drawing does not exist');
      return;
    }

    // Download drawing data
    const drawingData = await storageService.downloadDrawing(drawingId);
    console.log('Drawing data:', JSON.stringify(drawingData, null, 2));

    // Download thumbnail
    const thumbnailBuffer = await storageService.downloadThumbnail(drawingId);
    console.log('Thumbnail size:', thumbnailBuffer.length, 'bytes');

    console.log('Download complete!');
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Example: Delete a drawing
 */
export async function exampleDelete(drawingId: string): Promise<void> {
  const storageService = getStorageService();

  try {
    console.log(`Deleting drawing ${drawingId}...`);

    await storageService.deleteDrawing(drawingId);

    console.log('Delete complete!');
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

/**
 * Example: Complete workflow
 */
export async function exampleWorkflow(): Promise<void> {
  const testDrawingId = 'test-drawing-' + Date.now();

  console.log('=== Storage Service Example Workflow ===\n');

  // Upload
  await exampleUpload(testDrawingId);
  console.log('');

  // Download
  await exampleDownload(testDrawingId);
  console.log('');

  // Delete
  await exampleDelete(testDrawingId);
  console.log('');

  console.log('=== Workflow Complete ===');
}

// Uncomment to run the example:
// import { initializeStorageService } from './storage.service';
// import { storageConfig } from '../config/storage';
// 
// initializeStorageService(storageConfig);
// exampleWorkflow().catch(console.error);
