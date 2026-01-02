import { StorageService } from '../storage.service';
import * as fc from 'fast-check';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  })),
}));

// **Feature: supabase-migration, Property 3: Drawing storage round-trip**
// **Validates: Requirements 2.1, 2.3**
describe('Property-Based Test: Drawing storage round-trip', () => {
  let storageService: StorageService;
  let mockUpload: jest.Mock;
  let mockDownload: jest.Mock;
  let mockGetPublicUrl: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh mock functions
    mockUpload = jest.fn();
    mockDownload = jest.fn();
    mockGetPublicUrl = jest.fn();

    // Mock the Supabase client with our mock functions
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          download: mockDownload,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    });

    storageService = new StorageService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      bucket: 'test-bucket',
    });
  });

  it('should preserve drawing data structure and content through upload and download cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary drawing data objects
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text'),
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1, max: 1000 }),
            height: fc.integer({ min: 1, max: 1000 }),
            strokeColor: fc.string(),
            backgroundColor: fc.string(),
            fillStyle: fc.constantFrom('solid', 'hachure', 'cross-hatch'),
            strokeWidth: fc.integer({ min: 1, max: 10 }),
            roughness: fc.integer({ min: 0, max: 2 }),
            opacity: fc.integer({ min: 0, max: 100 }),
          })),
          appState: fc.record({
            viewBackgroundColor: fc.string(),
            gridSize: fc.option(fc.integer({ min: 10, max: 100 })),
            zoom: fc.record({
              value: fc.double({ min: 0.1, max: 3.0, noNaN: true }),
            }),
          }),
          scrollToContent: fc.boolean(),
        }),
        async (drawingId, drawingData) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          // Setup mock to return the uploaded data when downloaded
          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json` } 
          });

          // Mock download to return the same data that was uploaded
          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            // Convert Buffer back to Blob for realistic simulation
            const blob = new Blob([uploadedData], { type: 'application/json' });
            return { data: blob, error: null };
          });

          // Upload the drawing
          await storageService.uploadDrawing(drawingId, drawingData);

          // Download the drawing
          const downloadedData = await storageService.downloadDrawing(drawingId);

          // Verify the downloaded data matches the uploaded data
          expect(downloadedData).toEqual(drawingData);
          
          // Verify the structure is preserved
          expect(downloadedData).toHaveProperty('elements');
          expect(downloadedData).toHaveProperty('appState');
          expect(downloadedData).toHaveProperty('scrollToContent');
          
          // Verify arrays are preserved
          if (Array.isArray(drawingData.elements)) {
            expect(Array.isArray(downloadedData.elements)).toBe(true);
            expect(downloadedData.elements).toHaveLength(drawingData.elements.length);
          }
          
          // Verify nested objects are preserved
          if (drawingData.appState) {
            expect(downloadedData.appState).toBeDefined();
            expect(typeof downloadedData.appState).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty drawing data objects in round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          const emptyDrawing = { elements: [], appState: {}, scrollToContent: false };

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'application/json' });
            return { data: blob, error: null };
          });

          await storageService.uploadDrawing(drawingId, emptyDrawing);
          const downloadedData = await storageService.downloadDrawing(drawingId);

          expect(downloadedData).toEqual(emptyDrawing);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve special characters and unicode in drawing data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.constant('text'),
            text: fc.string(), // Can include unicode and special characters
          })),
          metadata: fc.record({
            title: fc.string(),
            description: fc.string(),
          }),
        }),
        async (drawingId, drawingData) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'application/json' });
            return { data: blob, error: null };
          });

          await storageService.uploadDrawing(drawingId, drawingData);
          const downloadedData = await storageService.downloadDrawing(drawingId);

          expect(downloadedData).toEqual(drawingData);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve numeric precision in drawing coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            x: fc.double({ min: -10000, max: 10000, noNaN: true }).filter(n => !Object.is(n, -0)),
            y: fc.double({ min: -10000, max: 10000, noNaN: true }).filter(n => !Object.is(n, -0)),
            width: fc.double({ min: 0.1, max: 5000, noNaN: true }).filter(n => !Object.is(n, -0)),
            height: fc.double({ min: 0.1, max: 5000, noNaN: true }).filter(n => !Object.is(n, -0)),
            angle: fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }).filter(n => !Object.is(n, -0)),
          })),
        }),
        async (drawingId, drawingData) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'application/json' });
            return { data: blob, error: null };
          });

          await storageService.uploadDrawing(drawingId, drawingData);
          const downloadedData = await storageService.downloadDrawing(drawingId);

          expect(downloadedData).toEqual(drawingData);
          
          // Verify numeric values are preserved
          if (drawingData.elements.length > 0) {
            expect(downloadedData.elements[0].x).toBe(drawingData.elements[0].x);
            expect(downloadedData.elements[0].y).toBe(drawingData.elements[0].y);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve nested object structures in drawing data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            boundElements: fc.option(fc.array(fc.record({
              id: fc.string(),
              type: fc.constantFrom('arrow', 'line'),
            }))),
            customData: fc.option(fc.record({
              metadata: fc.record({
                tags: fc.array(fc.string()),
                properties: fc.dictionary(fc.string(), fc.string()),
              }),
            })),
          })),
        }),
        async (drawingId, drawingData) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'application/json' });
            return { data: blob, error: null };
          });

          await storageService.uploadDrawing(drawingId, drawingData);
          const downloadedData = await storageService.downloadDrawing(drawingId);

          expect(downloadedData).toEqual(drawingData);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: supabase-migration, Property 5: Drawing deletion completeness**
// **Validates: Requirements 2.5**
describe('Property-Based Test: Drawing deletion completeness', () => {
  let storageService: StorageService;
  let mockUpload: jest.Mock;
  let mockDownload: jest.Mock;
  let mockRemove: jest.Mock;
  let mockList: jest.Mock;
  let mockGetPublicUrl: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh mock functions
    mockUpload = jest.fn();
    mockDownload = jest.fn();
    mockRemove = jest.fn();
    mockList = jest.fn();
    mockGetPublicUrl = jest.fn();

    // Mock the Supabase client with our mock functions
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          download: mockDownload,
          remove: mockRemove,
          list: mockList,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    });

    storageService = new StorageService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      bucket: 'test-bucket',
    });
  });

  it('should remove both drawing data and thumbnail after deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary drawing data
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('rectangle', 'ellipse', 'diamond'),
            x: fc.integer(),
            y: fc.integer(),
          })),
        }),
        // Generate arbitrary thumbnail data
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (drawingId, drawingData, thumbnailBytes) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup remove mock to track deletions
          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            const thumbnailKey = `drawings/${drawingId}/thumbnail.png`;
            
            // Check if the file being searched for exists
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload drawing and thumbnail
          const thumbnailBuffer = Buffer.from(thumbnailBytes);
          await storageService.uploadDrawing(drawingId, drawingData);
          await storageService.uploadThumbnail(drawingId, thumbnailBuffer);

          // Verify both files exist before deletion
          const existsBeforeDeletion = await storageService.drawingExists(drawingId);
          expect(existsBeforeDeletion).toBe(true);

          // Delete the drawing
          await storageService.deleteDrawing(drawingId);

          // Verify both files are removed
          const drawingKey = `drawings/${drawingId}/data.json`;
          const thumbnailKey = `drawings/${drawingId}/thumbnail.png`;
          
          expect(uploadedFiles.has(drawingKey)).toBe(false);
          expect(uploadedFiles.has(thumbnailKey)).toBe(false);

          // Verify drawingExists returns false after deletion
          const existsAfterDeletion = await storageService.drawingExists(drawingId);
          expect(existsAfterDeletion).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deletion when only drawing exists (no thumbnail)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.string(),
          })),
        }),
        async (drawingId, drawingData) => {
          mockUpload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          const uploadedFiles = new Set<string>();

          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload only the drawing (no thumbnail)
          await storageService.uploadDrawing(drawingId, drawingData);

          // Verify drawing exists
          const existsBefore = await storageService.drawingExists(drawingId);
          expect(existsBefore).toBe(true);

          // Delete the drawing
          await storageService.deleteDrawing(drawingId);

          // Verify drawing is removed
          const drawingKey = `drawings/${drawingId}/data.json`;
          expect(uploadedFiles.has(drawingKey)).toBe(false);

          // Verify drawingExists returns false
          const existsAfter = await storageService.drawingExists(drawingId);
          expect(existsAfter).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deletion when only thumbnail exists (no drawing data)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (drawingId, thumbnailBytes) => {
          mockUpload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          const uploadedFiles = new Set<string>();

          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload only the thumbnail (no drawing data)
          const thumbnailBuffer = Buffer.from(thumbnailBytes);
          await storageService.uploadThumbnail(drawingId, thumbnailBuffer);

          // Delete the drawing (should delete thumbnail even though drawing doesn't exist)
          await storageService.deleteDrawing(drawingId);

          // Verify thumbnail is removed
          const thumbnailKey = `drawings/${drawingId}/thumbnail.png`;
          expect(uploadedFiles.has(thumbnailKey)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deletion of non-existent drawing gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          mockRemove.mockClear();
          mockList.mockClear();

          const uploadedFiles = new Set<string>();

          mockRemove.mockImplementation(async (keys: string[]) => {
            // Simulate successful deletion even if files don't exist
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          mockList.mockImplementation(async (folder: string, options: any) => {
            // No files exist
            return { data: [], error: null };
          });

          // Verify drawing doesn't exist
          const existsBefore = await storageService.drawingExists(drawingId);
          expect(existsBefore).toBe(false);

          // Delete non-existent drawing (should not throw error)
          await expect(storageService.deleteDrawing(drawingId)).resolves.not.toThrow();

          // Verify it still doesn't exist
          const existsAfter = await storageService.drawingExists(drawingId);
          expect(existsAfter).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure deletion is idempotent (deleting twice has same effect as once)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.string(),
          })),
        }),
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (drawingId, drawingData, thumbnailBytes) => {
          mockUpload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          const uploadedFiles = new Set<string>();

          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload drawing and thumbnail
          const thumbnailBuffer = Buffer.from(thumbnailBytes);
          await storageService.uploadDrawing(drawingId, drawingData);
          await storageService.uploadThumbnail(drawingId, thumbnailBuffer);

          // Delete once
          await storageService.deleteDrawing(drawingId);

          // Verify files are removed
          const existsAfterFirstDelete = await storageService.drawingExists(drawingId);
          expect(existsAfterFirstDelete).toBe(false);

          // Delete again (idempotent operation)
          await expect(storageService.deleteDrawing(drawingId)).resolves.not.toThrow();

          // Verify still doesn't exist
          const existsAfterSecondDelete = await storageService.drawingExists(drawingId);
          expect(existsAfterSecondDelete).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: supabase-migration, Property 4: Thumbnail storage round-trip**
// **Validates: Requirements 2.2, 2.4**
describe('Property-Based Test: Thumbnail storage round-trip', () => {
  let storageService: StorageService;
  let mockUpload: jest.Mock;
  let mockDownload: jest.Mock;
  let mockGetPublicUrl: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh mock functions
    mockUpload = jest.fn();
    mockDownload = jest.fn();
    mockGetPublicUrl = jest.fn();

    // Mock the Supabase client with our mock functions
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          download: mockDownload,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    });

    storageService = new StorageService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      bucket: 'test-bucket',
    });
  });

  it('should preserve thumbnail binary content through upload and download cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary image buffers (simulating PNG data)
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (drawingId, imageBytes) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          // Convert Uint8Array to Buffer for the test
          const imageBuffer = Buffer.from(imageBytes);

          // Setup mock to return the uploaded data when downloaded
          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png` } 
          });

          // Mock upload to capture the uploaded data
          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          // Mock download to return the same data that was uploaded
          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            // Convert Buffer back to Blob for realistic simulation
            const blob = new Blob([uploadedData], { type: 'image/png' });
            return { data: blob, error: null };
          });

          // Upload the thumbnail
          await storageService.uploadThumbnail(drawingId, imageBuffer);

          // Download the thumbnail
          const downloadedBuffer = await storageService.downloadThumbnail(drawingId);

          // Verify the downloaded buffer matches the uploaded buffer
          expect(downloadedBuffer).toEqual(imageBuffer);
          expect(downloadedBuffer.length).toBe(imageBuffer.length);
          
          // Verify byte-by-byte equality
          for (let i = 0; i < imageBuffer.length; i++) {
            expect(downloadedBuffer[i]).toBe(imageBuffer[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve base64-encoded thumbnail data through upload and download cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary image buffers
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (drawingId, imageBytes) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          // Convert to base64 string (simulating frontend sending base64)
          const imageBuffer = Buffer.from(imageBytes);
          const base64String = imageBuffer.toString('base64');

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'image/png' });
            return { data: blob, error: null };
          });

          // Upload the thumbnail as base64 string
          await storageService.uploadThumbnail(drawingId, base64String);

          // Download the thumbnail
          const downloadedBuffer = await storageService.downloadThumbnail(drawingId);

          // Verify the downloaded buffer matches the original buffer
          expect(downloadedBuffer).toEqual(imageBuffer);
          expect(downloadedBuffer.length).toBe(imageBuffer.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve base64 data URL formatted thumbnails through upload and download cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary image buffers
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (drawingId, imageBytes) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          // Convert to data URL format (simulating canvas.toDataURL())
          const imageBuffer = Buffer.from(imageBytes);
          const base64String = imageBuffer.toString('base64');
          const dataUrl = `data:image/png;base64,${base64String}`;

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'image/png' });
            return { data: blob, error: null };
          });

          // Upload the thumbnail as data URL
          await storageService.uploadThumbnail(drawingId, dataUrl);

          // Download the thumbnail
          const downloadedBuffer = await storageService.downloadThumbnail(drawingId);

          // Verify the downloaded buffer matches the original buffer
          expect(downloadedBuffer).toEqual(imageBuffer);
          expect(downloadedBuffer.length).toBe(imageBuffer.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty thumbnail buffers in round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          // Create an empty buffer (edge case)
          const emptyBuffer = Buffer.alloc(0);

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'image/png' });
            return { data: blob, error: null };
          });

          await storageService.uploadThumbnail(drawingId, emptyBuffer);
          const downloadedBuffer = await storageService.downloadThumbnail(drawingId);

          expect(downloadedBuffer).toEqual(emptyBuffer);
          expect(downloadedBuffer.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve large thumbnail buffers through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate larger buffers to test size handling
        fc.uint8Array({ minLength: 50000, maxLength: 100000 }),
        async (drawingId, imageBytes) => {
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockGetPublicUrl.mockClear();

          const imageBuffer = Buffer.from(imageBytes);

          mockUpload.mockResolvedValue({ error: null });
          mockGetPublicUrl.mockReturnValue({ 
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png` } 
          });

          let uploadedData: Buffer | null = null;
          mockUpload.mockImplementation(async (key: string, data: Buffer) => {
            uploadedData = data;
            return { error: null };
          });

          mockDownload.mockImplementation(async () => {
            if (!uploadedData) {
              return { data: null, error: new Error('No data uploaded') };
            }
            const blob = new Blob([uploadedData], { type: 'image/png' });
            return { data: blob, error: null };
          });

          await storageService.uploadThumbnail(drawingId, imageBuffer);
          const downloadedBuffer = await storageService.downloadThumbnail(drawingId);

          expect(downloadedBuffer).toEqual(imageBuffer);
          expect(downloadedBuffer.length).toBe(imageBuffer.length);
        }
      ),
      { numRuns: 50 } // Fewer runs for larger data
    );
  });
});

// **Feature: supabase-migration, Property 6: Drawing existence check accuracy**
// **Validates: Requirements 2.6**
describe('Property-Based Test: Drawing existence check accuracy', () => {
  let storageService: StorageService;
  let mockUpload: jest.Mock;
  let mockRemove: jest.Mock;
  let mockList: jest.Mock;
  let mockGetPublicUrl: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh mock functions
    mockUpload = jest.fn();
    mockRemove = jest.fn();
    mockList = jest.fn();
    mockGetPublicUrl = jest.fn();

    // Mock the Supabase client with our mock functions
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          remove: mockRemove,
          list: mockList,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    });

    storageService = new StorageService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      bucket: 'test-bucket',
    });
  });

  it('should return true for drawingExists after successful upload', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary drawing data
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('rectangle', 'ellipse', 'diamond'),
            x: fc.integer(),
            y: fc.integer(),
          })),
        }),
        async (drawingId, drawingData) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            // Check if the file being searched for exists
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload the drawing
          await storageService.uploadDrawing(drawingId, drawingData);

          // Verify drawingExists returns true after upload
          const exists = await storageService.drawingExists(drawingId);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for drawingExists when drawing was never uploaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockList.mockClear();

          // Setup list mock to return empty (no files exist)
          mockList.mockImplementation(async (folder: string, options: any) => {
            // No files exist
            return { data: [], error: null };
          });

          // Check existence without uploading
          const exists = await storageService.drawingExists(drawingId);
          
          // Verify drawingExists returns false for never-uploaded drawing
          expect(exists).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for drawingExists after drawing is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary drawing data
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('rectangle', 'ellipse', 'diamond'),
            x: fc.integer(),
            y: fc.integer(),
          })),
        }),
        async (drawingId, drawingData) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup remove mock to track deletions
          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            // Check if the file being searched for exists
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload the drawing
          await storageService.uploadDrawing(drawingId, drawingData);

          // Verify it exists after upload
          const existsAfterUpload = await storageService.drawingExists(drawingId);
          expect(existsAfterUpload).toBe(true);

          // Delete the drawing
          await storageService.deleteDrawing(drawingId);

          // Verify drawingExists returns false after deletion
          const existsAfterDeletion = await storageService.drawingExists(drawingId);
          expect(existsAfterDeletion).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently return false for multiple checks on non-existent drawing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockList.mockClear();

          // Setup list mock to return empty (no files exist)
          mockList.mockImplementation(async (folder: string, options: any) => {
            return { data: [], error: null };
          });

          // Check existence multiple times
          const exists1 = await storageService.drawingExists(drawingId);
          const exists2 = await storageService.drawingExists(drawingId);
          const exists3 = await storageService.drawingExists(drawingId);
          
          // All checks should consistently return false
          expect(exists1).toBe(false);
          expect(exists2).toBe(false);
          expect(exists3).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently return true for multiple checks on uploaded drawing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate arbitrary drawing data
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.string(),
          })),
        }),
        async (drawingId, drawingData) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload the drawing
          await storageService.uploadDrawing(drawingId, drawingData);

          // Check existence multiple times
          const exists1 = await storageService.drawingExists(drawingId);
          const exists2 = await storageService.drawingExists(drawingId);
          const exists3 = await storageService.drawingExists(drawingId);
          
          // All checks should consistently return true
          expect(exists1).toBe(true);
          expect(exists2).toBe(true);
          expect(exists3).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle existence check for different drawing IDs independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different drawing IDs
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/'))
        ).filter(([id1, id2]) => id1 !== id2),
        // Generate drawing data
        fc.record({
          elements: fc.array(fc.record({
            id: fc.string(),
            type: fc.string(),
          })),
        }),
        async ([drawingId1, drawingId2], drawingData) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey1 = `drawings/${drawingId1}/data.json`;
            const drawingKey2 = `drawings/${drawingId2}/data.json`;
            
            if (options?.search === 'data.json') {
              // Check which drawing is being queried based on folder
              if (folder === `drawings/${drawingId1}`) {
                const exists = uploadedFiles.has(drawingKey1);
                return { 
                  data: exists ? [{ name: 'data.json' }] : [], 
                  error: null 
                };
              } else if (folder === `drawings/${drawingId2}`) {
                const exists = uploadedFiles.has(drawingKey2);
                return { 
                  data: exists ? [{ name: 'data.json' }] : [], 
                  error: null 
                };
              }
            }
            
            return { data: [], error: null };
          });

          // Upload only the first drawing
          await storageService.uploadDrawing(drawingId1, drawingData);

          // Check existence for both drawings
          const exists1 = await storageService.drawingExists(drawingId1);
          const exists2 = await storageService.drawingExists(drawingId2);
          
          // First drawing should exist, second should not
          expect(exists1).toBe(true);
          expect(exists2).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle existence check after re-uploading a deleted drawing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        // Generate two different drawing data objects
        fc.tuple(
          fc.record({
            elements: fc.array(fc.record({
              id: fc.string(),
              type: fc.string(),
            })),
          }),
          fc.record({
            elements: fc.array(fc.record({
              id: fc.string(),
              type: fc.string(),
            })),
          })
        ),
        async (drawingId, [drawingData1, drawingData2]) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockRemove.mockClear();
          mockList.mockClear();
          mockGetPublicUrl.mockClear();

          // Track uploaded files
          const uploadedFiles = new Set<string>();

          // Setup upload mock
          mockUpload.mockImplementation(async (key: string) => {
            uploadedFiles.add(key);
            return { error: null };
          });

          mockGetPublicUrl.mockImplementation((key: string) => ({
            data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
          }));

          // Setup remove mock to track deletions
          mockRemove.mockImplementation(async (keys: string[]) => {
            keys.forEach(key => uploadedFiles.delete(key));
            return { error: null };
          });

          // Setup list mock to check existence
          mockList.mockImplementation(async (folder: string, options: any) => {
            const drawingKey = `drawings/${drawingId}/data.json`;
            
            if (options?.search === 'data.json') {
              const exists = uploadedFiles.has(drawingKey);
              return { 
                data: exists ? [{ name: 'data.json' }] : [], 
                error: null 
              };
            }
            
            return { data: [], error: null };
          });

          // Upload the first drawing
          await storageService.uploadDrawing(drawingId, drawingData1);
          const existsAfterFirstUpload = await storageService.drawingExists(drawingId);
          expect(existsAfterFirstUpload).toBe(true);

          // Delete the drawing
          await storageService.deleteDrawing(drawingId);
          const existsAfterDeletion = await storageService.drawingExists(drawingId);
          expect(existsAfterDeletion).toBe(false);

          // Re-upload with different data
          await storageService.uploadDrawing(drawingId, drawingData2);
          const existsAfterReUpload = await storageService.drawingExists(drawingId);
          expect(existsAfterReUpload).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
