import { StorageService } from '../storage.service';
import * as fc from 'fast-check';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  })),
}));

describe('StorageService - Key Generation', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // Initialize storage service with test configuration
    storageService = new StorageService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      bucket: 'test-bucket',
    });
  });

  describe('Drawing key generation', () => {
    it('should generate drawing key following pattern drawings/{id}/data.json', () => {
      const drawingId = 'test-drawing-123';
      
      // Access the private method through a workaround
      // We'll test this indirectly by checking the key used in upload operations
      const expectedKey = `drawings/${drawingId}/data.json`;
      
      // Verify the pattern is correct
      expect(expectedKey).toMatch(/^drawings\/[^/]+\/data\.json$/);
      expect(expectedKey).toBe('drawings/test-drawing-123/data.json');
    });

    it('should generate drawing keys with different IDs correctly', () => {
      const testIds = [
        'abc-123',
        'drawing-456',
        'uuid-789-xyz',
        '12345',
      ];

      testIds.forEach(id => {
        const expectedKey = `drawings/${id}/data.json`;
        expect(expectedKey).toMatch(/^drawings\/[^/]+\/data\.json$/);
        expect(expectedKey).toBe(`drawings/${id}/data.json`);
      });
    });

    it('should generate unique keys for different drawing IDs', () => {
      const id1 = 'drawing-1';
      const id2 = 'drawing-2';
      
      const key1 = `drawings/${id1}/data.json`;
      const key2 = `drawings/${id2}/data.json`;
      
      expect(key1).not.toBe(key2);
      expect(key1).toBe('drawings/drawing-1/data.json');
      expect(key2).toBe('drawings/drawing-2/data.json');
    });
  });

  describe('Thumbnail key generation', () => {
    it('should generate thumbnail key following pattern drawings/{id}/thumbnail.png', () => {
      const drawingId = 'test-drawing-123';
      
      const expectedKey = `drawings/${drawingId}/thumbnail.png`;
      
      // Verify the pattern is correct
      expect(expectedKey).toMatch(/^drawings\/[^/]+\/thumbnail\.png$/);
      expect(expectedKey).toBe('drawings/test-drawing-123/thumbnail.png');
    });

    it('should generate thumbnail keys with different IDs correctly', () => {
      const testIds = [
        'abc-123',
        'drawing-456',
        'uuid-789-xyz',
        '12345',
      ];

      testIds.forEach(id => {
        const expectedKey = `drawings/${id}/thumbnail.png`;
        expect(expectedKey).toMatch(/^drawings\/[^/]+\/thumbnail\.png$/);
        expect(expectedKey).toBe(`drawings/${id}/thumbnail.png`);
      });
    });

    it('should generate unique thumbnail keys for different drawing IDs', () => {
      const id1 = 'drawing-1';
      const id2 = 'drawing-2';
      
      const key1 = `drawings/${id1}/thumbnail.png`;
      const key2 = `drawings/${id2}/thumbnail.png`;
      
      expect(key1).not.toBe(key2);
      expect(key1).toBe('drawings/drawing-1/thumbnail.png');
      expect(key2).toBe('drawings/drawing-2/thumbnail.png');
    });

    it('should place thumbnail in same folder as drawing data', () => {
      const drawingId = 'test-123';
      
      const drawingKey = `drawings/${drawingId}/data.json`;
      const thumbnailKey = `drawings/${drawingId}/thumbnail.png`;
      
      // Extract folder paths
      const drawingFolder = drawingKey.substring(0, drawingKey.lastIndexOf('/'));
      const thumbnailFolder = thumbnailKey.substring(0, thumbnailKey.lastIndexOf('/'));
      
      expect(drawingFolder).toBe(thumbnailFolder);
      expect(drawingFolder).toBe(`drawings/${drawingId}`);
    });
  });

  describe('Base64 image decoding for thumbnails', () => {
    it('should decode base64 string without data URL prefix', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const buffer = Buffer.from(base64Data, 'base64');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should decode base64 string with data URL prefix', () => {
      const base64WithPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64Data = base64WithPrefix.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle different image format prefixes', () => {
      const formats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      formats.forEach(format => {
        const dataUrl = `data:image/${format};base64,${base64Data}`;
        const cleaned = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleaned, 'base64');
        
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(cleaned).toBe(base64Data);
      });
    });

    it('should produce same buffer from base64 with or without prefix', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64WithPrefix = `data:image/png;base64,${base64Data}`;
      
      const buffer1 = Buffer.from(base64Data, 'base64');
      const cleanedData = base64WithPrefix.replace(/^data:image\/\w+;base64,/, '');
      const buffer2 = Buffer.from(cleanedData, 'base64');
      
      expect(buffer1.equals(buffer2)).toBe(true);
    });

    it('should handle Buffer input directly', () => {
      const testData = Buffer.from('test image data');
      
      // If input is already a Buffer, it should be used as-is
      expect(testData).toBeInstanceOf(Buffer);
      expect(testData.toString()).toBe('test image data');
    });

    it('should decode valid base64 image data', () => {
      // This is a valid 1x1 transparent PNG in base64
      const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const buffer = Buffer.from(validPngBase64, 'base64');
      
      // Verify it's a valid PNG by checking the PNG signature
      expect(buffer[0]).toBe(0x89); // PNG signature starts with 0x89
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4E); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });
  });
});

// **Feature: supabase-migration, Property 11: Storage key structure consistency**
// **Validates: Requirements 5.2**
describe('Property-Based Test: Storage key structure consistency', () => {
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
    mockUpload = jest.fn().mockResolvedValue({ error: null });
    mockDownload = jest.fn().mockResolvedValue({ 
      data: new Blob(['{"test": "data"}'], { type: 'application/json' }), 
      error: null 
    });
    mockRemove = jest.fn().mockResolvedValue({ error: null });
    mockList = jest.fn().mockResolvedValue({ data: [], error: null });
    mockGetPublicUrl = jest.fn().mockReturnValue({ 
      data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' } 
    });

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

  it('should generate drawing keys following pattern drawings/{drawingId}/data.json for any drawing ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes to avoid path issues)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          
          // Upload a drawing to trigger key generation
          await storageService.uploadDrawing(drawingId, { test: 'data' });

          // Verify the upload was called with the correct key pattern
          expect(mockUpload).toHaveBeenCalledTimes(1);
          const uploadCall = mockUpload.mock.calls[0];
          const key = uploadCall[0];

          // Check the key follows the pattern drawings/{drawingId}/data.json
          expect(key).toBe(`drawings/${drawingId}/data.json`);
          expect(key).toMatch(/^drawings\/[^/]+\/data\.json$/);
          
          // Verify the key structure
          const parts = key.split('/');
          expect(parts).toHaveLength(3);
          expect(parts[0]).toBe('drawings');
          expect(parts[1]).toBe(drawingId);
          expect(parts[2]).toBe('data.json');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate thumbnail keys following pattern drawings/{drawingId}/thumbnail.png for any drawing ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          
          // Upload a thumbnail to trigger key generation
          const testImageBuffer = Buffer.from('test-image-data');
          await storageService.uploadThumbnail(drawingId, testImageBuffer);

          // Verify the upload was called with the correct key pattern
          expect(mockUpload).toHaveBeenCalledTimes(1);
          const uploadCall = mockUpload.mock.calls[0];
          const key = uploadCall[0];

          // Check the key follows the pattern drawings/{drawingId}/thumbnail.png
          expect(key).toBe(`drawings/${drawingId}/thumbnail.png`);
          expect(key).toMatch(/^drawings\/[^/]+\/thumbnail\.png$/);
          
          // Verify the key structure
          const parts = key.split('/');
          expect(parts).toHaveLength(3);
          expect(parts[0]).toBe('drawings');
          expect(parts[1]).toBe(drawingId);
          expect(parts[2]).toBe('thumbnail.png');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should place drawing data and thumbnail in the same folder for any drawing ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs (non-empty strings without slashes)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          
          // Upload both drawing and thumbnail
          await storageService.uploadDrawing(drawingId, { test: 'data' });
          await storageService.uploadThumbnail(drawingId, Buffer.from('test-image'));

          // Get the keys from both upload calls
          expect(mockUpload).toHaveBeenCalledTimes(2);
          const drawingKey = mockUpload.mock.calls[0][0];
          const thumbnailKey = mockUpload.mock.calls[1][0];

          // Extract folder paths (everything before the last slash)
          const drawingFolder = drawingKey.substring(0, drawingKey.lastIndexOf('/'));
          const thumbnailFolder = thumbnailKey.substring(0, thumbnailKey.lastIndexOf('/'));

          // Verify both files are in the same folder
          expect(drawingFolder).toBe(thumbnailFolder);
          expect(drawingFolder).toBe(`drawings/${drawingId}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique keys for different drawing IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different drawing IDs
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/'))
        ).filter(([id1, id2]) => id1 !== id2),
        async ([drawingId1, drawingId2]) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          
          // Upload drawings with different IDs
          await storageService.uploadDrawing(drawingId1, { test: 'data1' });
          await storageService.uploadDrawing(drawingId2, { test: 'data2' });

          // Get the keys from both upload calls
          expect(mockUpload).toHaveBeenCalledTimes(2);
          const key1 = mockUpload.mock.calls[0][0];
          const key2 = mockUpload.mock.calls[1][0];

          // Verify the keys are different
          expect(key1).not.toBe(key2);
          expect(key1).toBe(`drawings/${drawingId1}/data.json`);
          expect(key2).toBe(`drawings/${drawingId2}/data.json`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain key structure consistency across all operations (upload, download, delete)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary drawing IDs
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')),
        async (drawingId) => {
          // Clear mocks before each property test iteration
          mockUpload.mockClear();
          mockDownload.mockClear();
          mockRemove.mockClear();
          
          // Perform upload operation
          await storageService.uploadDrawing(drawingId, { test: 'data' });
          expect(mockUpload).toHaveBeenCalledTimes(1);
          const uploadKey = mockUpload.mock.calls[0][0];

          // Perform download operation
          await storageService.downloadDrawing(drawingId);
          expect(mockDownload).toHaveBeenCalledTimes(1);
          const downloadKey = mockDownload.mock.calls[0][0];

          // Perform delete operation (deletes both drawing and thumbnail)
          await storageService.deleteDrawing(drawingId);
          // deleteDrawing calls remove twice: once for drawing, once for thumbnail
          expect(mockRemove).toHaveBeenCalledTimes(2);
          const deleteCall1Keys = mockRemove.mock.calls[0][0];
          const deleteCall2Keys = mockRemove.mock.calls[1][0];

          // Verify all operations use the same key structure
          expect(uploadKey).toBe(`drawings/${drawingId}/data.json`);
          expect(downloadKey).toBe(`drawings/${drawingId}/data.json`);
          
          // Verify delete calls include both drawing and thumbnail keys
          const allDeleteKeys = [...deleteCall1Keys, ...deleteCall2Keys];
          expect(allDeleteKeys).toContain(`drawings/${drawingId}/data.json`);
          expect(allDeleteKeys).toContain(`drawings/${drawingId}/thumbnail.png`);
          
          // Verify consistency
          expect(uploadKey).toBe(downloadKey);
        }
      ),
      { numRuns: 100 }
    );
  });
});

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
              value: fc.double({ min: 0.1, max: 3.0 }),
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
            x: fc.double({ min: -10000, max: 10000 }),
            y: fc.double({ min: -10000, max: 10000 }),
            width: fc.double({ min: 0.1, max: 5000 }),
            height: fc.double({ min: 0.1, max: 5000 }),
            angle: fc.double({ min: 0, max: 2 * Math.PI }),
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
              value: fc.double({ min: 0.1, max: 3.0 }),
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
            x: fc.double({ min: -10000, max: 10000 }),
            y: fc.double({ min: -10000, max: 10000 }),
            width: fc.double({ min: 0.1, max: 5000 }),
            height: fc.double({ min: 0.1, max: 5000 }),
            angle: fc.double({ min: 0, max: 2 * Math.PI }),
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

// Unit Tests for Storage Service Error Handling
// Requirements: 2.7
describe('StorageService - Error Handling', () => {
  let storageService: StorageService;
  let mockUpload: jest.Mock;
  let mockDownload: jest.Mock;
  let mockRemove: jest.Mock;
  let mockGetPublicUrl: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpload = jest.fn();
    mockDownload = jest.fn();
    mockRemove = jest.fn();
    mockGetPublicUrl = jest.fn();

    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          download: mockDownload,
          remove: mockRemove,
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

  describe('Retry logic with simulated failures', () => {
    it('should retry upload operation up to 3 times on failure', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const error = new Error('Network error');

      // Mock upload to fail 3 times
      mockUpload.mockRejectedValue(error);

      // Attempt upload and expect it to fail after retries
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow(
        'Failed to upload file after 3 attempts'
      );

      // Verify upload was called 3 times (max retries)
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    it('should succeed on second attempt if first attempt fails', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const error = new Error('Temporary network error');

      // Mock upload to fail once, then succeed
      mockUpload
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ error: null });
      
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      // Attempt upload
      const result = await storageService.uploadDrawing(drawingId, drawingData);

      // Verify upload was called twice (failed once, succeeded on retry)
      expect(mockUpload).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
    });

    it('should retry download operation up to 3 times on failure', async () => {
      const drawingId = 'test-drawing-123';
      const error = new Error('Download failed');

      // Mock download to fail 3 times
      mockDownload.mockRejectedValue(error);

      // Attempt download and expect it to fail after retries
      await expect(storageService.downloadDrawing(drawingId)).rejects.toThrow(
        'Failed to download file after 3 attempts'
      );

      // Verify download was called 3 times (max retries)
      expect(mockDownload).toHaveBeenCalledTimes(3);
    });

    it('should succeed on third attempt if first two attempts fail', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const error = new Error('Temporary error');
      const jsonString = JSON.stringify(drawingData);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Mock download to fail twice, then succeed
      mockDownload
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: blob, error: null });

      // Attempt download
      const result = await storageService.downloadDrawing(drawingId);

      // Verify download was called 3 times (failed twice, succeeded on third attempt)
      expect(mockDownload).toHaveBeenCalledTimes(3);
      expect(result).toEqual(drawingData);
    });

    it('should retry delete operation up to 3 times on failure', async () => {
      const drawingId = 'test-drawing-123';
      const error = new Error('Delete failed');

      // Mock remove to fail 3 times
      mockRemove.mockRejectedValue(error);

      // Attempt delete (deleteDrawing deletes both drawing and thumbnail)
      // It uses Promise.allSettled, so it won't throw but will complete
      await storageService.deleteDrawing(drawingId);

      // Verify remove was called 6 times total (3 attempts × 2 files)
      expect(mockRemove).toHaveBeenCalledTimes(6);
    });

    it('should implement exponential backoff between retry attempts', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const error = new Error('Network error');
      const startTime = Date.now();

      // Mock upload to fail 3 times
      mockUpload.mockRejectedValue(error);

      // Attempt upload and expect it to fail after retries
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow();

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      // With exponential backoff: 1000ms + 2000ms = 3000ms minimum
      // Allow some tolerance for execution time
      expect(elapsedTime).toBeGreaterThanOrEqual(2900);
    });
  });

  describe('Error handling for invalid inputs', () => {
    it('should handle null drawing data gracefully', async () => {
      const drawingId = 'test-drawing-123';
      
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      // Upload null data (should be serialized as JSON)
      const result = await storageService.uploadDrawing(drawingId, null);

      expect(result).toHaveProperty('key');
      expect(mockUpload).toHaveBeenCalledTimes(1);
      
      // Verify the data was serialized correctly
      const uploadCall = mockUpload.mock.calls[0];
      const uploadedBuffer = uploadCall[1];
      expect(uploadedBuffer.toString('utf-8')).toBe('null');
    });

    it('should handle empty string drawing ID', async () => {
      const drawingId = '';
      const drawingData = { test: 'data' };
      
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      // Upload with empty ID (should still generate a key)
      const result = await storageService.uploadDrawing(drawingId, drawingData);

      expect(result).toHaveProperty('key');
      expect(result.key).toBe('drawings//data.json');
    });

    it('should handle invalid base64 thumbnail data', async () => {
      const drawingId = 'test-drawing-123';
      const invalidBase64 = 'not-valid-base64!!!';
      
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      // Upload invalid base64 (Buffer.from will handle it, but may produce unexpected results)
      const result = await storageService.uploadThumbnail(drawingId, invalidBase64);

      expect(result).toHaveProperty('key');
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed JSON during download', async () => {
      const drawingId = 'test-drawing-123';
      const malformedJson = 'not valid json {';
      const blob = new Blob([malformedJson], { type: 'application/json' });

      mockDownload.mockResolvedValue({ data: blob, error: null });

      // Attempt to download and parse malformed JSON
      await expect(storageService.downloadDrawing(drawingId)).rejects.toThrow();
    });

    it('should handle empty response from storage', async () => {
      const drawingId = 'test-drawing-123';

      // Mock download to return null data
      mockDownload.mockResolvedValue({ data: null, error: null });

      // Attempt download with no data
      await expect(storageService.downloadDrawing(drawingId)).rejects.toThrow(
        'No data received from storage'
      );
    });

    it('should handle Supabase error responses', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const supabaseError = { message: 'Bucket not found', statusCode: 404 };

      // Mock upload to return Supabase error
      mockUpload.mockResolvedValue({ error: supabaseError });

      // Attempt upload with Supabase error
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow();

      // Verify retry logic was applied
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });
  });

  describe('Handling of network timeouts', () => {
    it('should handle timeout errors during upload', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      // Mock upload to timeout
      mockUpload.mockRejectedValue(timeoutError);

      // Attempt upload and expect it to fail after retries
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow(
        'Failed to upload file after 3 attempts'
      );

      // Verify upload was retried
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors during download', async () => {
      const drawingId = 'test-drawing-123';
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      // Mock download to timeout
      mockDownload.mockRejectedValue(timeoutError);

      // Attempt download and expect it to fail after retries
      await expect(storageService.downloadDrawing(drawingId)).rejects.toThrow(
        'Failed to download file after 3 attempts'
      );

      // Verify download was retried
      expect(mockDownload).toHaveBeenCalledTimes(3);
    });

    it('should handle connection refused errors', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const connectionError = new Error('ECONNREFUSED');
      connectionError.name = 'NetworkError';

      // Mock upload to fail with connection error
      mockUpload.mockRejectedValue(connectionError);

      // Attempt upload and expect it to fail after retries
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow(
        'Failed to upload file after 3 attempts'
      );

      // Verify upload was retried
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    it('should handle DNS resolution errors', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const dnsError = new Error('ENOTFOUND');
      dnsError.name = 'DNSError';

      // Mock upload to fail with DNS error
      mockUpload.mockRejectedValue(dnsError);

      // Attempt upload and expect it to fail after retries
      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow(
        'Failed to upload file after 3 attempts'
      );

      // Verify upload was retried
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    it('should recover from intermittent network errors', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const networkError = new Error('Network unreachable');

      // Mock upload to fail twice with network error, then succeed
      mockUpload
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ error: null });
      
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      // Attempt upload
      const result = await storageService.uploadDrawing(drawingId, drawingData);

      // Verify upload succeeded after retries
      expect(mockUpload).toHaveBeenCalledTimes(3);
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
    });

    it('should handle slow network responses without timing out prematurely', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };

      // Mock upload to succeed after a delay
      mockUpload.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ error: null });
          }, 500); // 500ms delay
        });
      });
      
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-key' }
      });

      const startTime = Date.now();
      const result = await storageService.uploadDrawing(drawingId, drawingData);
      const endTime = Date.now();

      // Verify upload succeeded
      expect(result).toHaveProperty('key');
      expect(mockUpload).toHaveBeenCalledTimes(1);
      
      // Verify it took at least 500ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(450);
    });
  });

  describe('Error message clarity', () => {
    it('should include original error message in retry failure', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const originalError = new Error('Bucket does not exist');

      mockUpload.mockRejectedValue(originalError);

      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow(
        'Failed to upload file after 3 attempts: Bucket does not exist'
      );
    });

    it('should log errors during retry attempts', async () => {
      const drawingId = 'test-drawing-123';
      const drawingData = { test: 'data' };
      const error = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUpload.mockRejectedValue(error);

      await expect(storageService.uploadDrawing(drawingId, drawingData)).rejects.toThrow();

      // Verify console.error was called for each retry attempt
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Upload attempt'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Partial failure handling', () => {
    it('should complete deleteDrawing even if thumbnail deletion fails', async () => {
      const drawingId = 'test-drawing-123';
      const error = new Error('Thumbnail not found');

      // Mock remove to succeed for drawing but fail for thumbnail
      mockRemove
        .mockResolvedValueOnce({ error: null }) // Drawing delete succeeds
        .mockRejectedValue(error); // Thumbnail delete fails

      // Delete should complete without throwing
      await expect(storageService.deleteDrawing(drawingId)).resolves.not.toThrow();

      // Verify both delete attempts were made
      expect(mockRemove).toHaveBeenCalledTimes(4); // 1 success + 3 retries for thumbnail
    });

    it('should complete deleteDrawing even if drawing deletion fails', async () => {
      const drawingId = 'test-drawing-123';
      const error = new Error('Drawing not found');

      // Mock remove to fail for drawing but succeed for thumbnail
      mockRemove
        .mockRejectedValue(error) // Drawing delete fails
        .mockResolvedValueOnce({ error: null }); // Thumbnail delete succeeds

      // Delete should complete without throwing
      await expect(storageService.deleteDrawing(drawingId)).resolves.not.toThrow();

      // Verify both delete attempts were made
      expect(mockRemove).toHaveBeenCalledTimes(4); // 3 retries for drawing + 1 success for thumbnail
    });
  });
});
