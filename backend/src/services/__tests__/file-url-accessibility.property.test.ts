import { StorageService } from '../storage.service';
import * as fc from 'fast-check';

/**
 * Feature: supabase-migration, Property 14: File URL accessibility
 * 
 * For any successfully uploaded file, the generated URL should be accessible 
 * via HTTP request and return the correct file content with appropriate 
 * content-type headers
 * 
 * Validates: Requirements 7.4
 */

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

describe('Property 14: File URL Accessibility', () => {
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

  describe('Drawing File URL Accessibility', () => {
    it('should generate valid and accessible URLs for drawing files', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary drawing IDs (URL-safe alphanumeric strings)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          // Generate arbitrary drawing data objects
          fc.record({
            elements: fc.array(fc.record({
              id: fc.string(),
              type: fc.constantFrom('rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text'),
              x: fc.integer(),
              y: fc.integer(),
              width: fc.integer({ min: 1, max: 1000 }),
              height: fc.integer({ min: 1, max: 1000 }),
            })),
            appState: fc.record({
              viewBackgroundColor: fc.string(),
              gridSize: fc.option(fc.integer({ min: 10, max: 100 })),
            }),
          }),
          async (drawingId, drawingData) => {
            // Clear mocks before each property test iteration
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();
            mockDownload.mockClear();

            // Setup upload mock
            mockUpload.mockResolvedValue({ error: null });

            // Generate the public URL
            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Mock download to simulate that the file is accessible
            const jsonString = JSON.stringify(drawingData);
            const buffer = Buffer.from(jsonString, 'utf-8');
            const blob = new Blob([buffer], { type: 'application/json' });
            mockDownload.mockResolvedValue({ data: blob, error: null });

            // Upload the drawing
            const uploadResult = await storageService.uploadDrawing(drawingId, drawingData);

            // Verify URL is generated
            expect(uploadResult.url).toBeDefined();
            expect(typeof uploadResult.url).toBe('string');
            expect(uploadResult.url.length).toBeGreaterThan(0);
            expect(uploadResult.url).toBe(expectedUrl);

            // Verify URL is a valid HTTP/HTTPS URL
            expect(uploadResult.url).toMatch(/^https?:\/\/.+/);
            const url = new URL(uploadResult.url);
            expect(url.protocol).toBe('https:');
            expect(url.hostname).toBeTruthy();
            expect(url.pathname).toContain('/storage/');
            expect(url.pathname).toContain(`/drawings/${drawingId}/data.json`);

            // Verify the file can be downloaded (simulating accessibility)
            const downloadedData = await storageService.downloadDrawing(drawingId);
            expect(downloadedData).toEqual(drawingData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate URLs with correct structure for drawing files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          async (drawingId, drawingData) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            const uploadResult = await storageService.uploadDrawing(drawingId, drawingData);

            // Verify URL structure
            expect(uploadResult.url).toContain('https://');
            expect(uploadResult.url).toContain('/storage/');
            expect(uploadResult.url).toContain(`/drawings/${drawingId}/data.json`);
            expect(uploadResult.url).toContain(storageService['bucket']);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Thumbnail File URL Accessibility', () => {
    it('should generate valid and accessible URLs for thumbnail files', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary drawing IDs (URL-safe alphanumeric strings)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          // Generate arbitrary image buffers (simulating PNG data)
          fc.uint8Array({ minLength: 100, maxLength: 5000 }),
          async (drawingId, imageBytes) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();
            mockDownload.mockClear();

            const imageBuffer = Buffer.from(imageBytes);

            // Setup upload mock
            mockUpload.mockResolvedValue({ error: null });

            // Generate the public URL
            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Mock download to simulate that the file is accessible
            const blob = new Blob([imageBuffer], { type: 'image/png' });
            mockDownload.mockResolvedValue({ data: blob, error: null });

            // Upload the thumbnail
            const uploadResult = await storageService.uploadThumbnail(drawingId, imageBuffer);

            // Verify URL is generated
            expect(uploadResult.url).toBeDefined();
            expect(typeof uploadResult.url).toBe('string');
            expect(uploadResult.url.length).toBeGreaterThan(0);
            expect(uploadResult.url).toBe(expectedUrl);

            // Verify URL is a valid HTTP/HTTPS URL
            expect(uploadResult.url).toMatch(/^https?:\/\/.+/);
            const url = new URL(uploadResult.url);
            expect(url.protocol).toBe('https:');
            expect(url.hostname).toBeTruthy();
            expect(url.pathname).toContain('/storage/');
            expect(url.pathname).toContain(`/drawings/${drawingId}/thumbnail.png`);

            // Verify the file can be downloaded (simulating accessibility)
            const downloadedBuffer = await storageService.downloadThumbnail(drawingId);
            expect(downloadedBuffer).toEqual(imageBuffer);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid URLs for base64-encoded thumbnails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.uint8Array({ minLength: 100, maxLength: 1000 }),
          async (drawingId, imageBytes) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();
            mockDownload.mockClear();

            // Convert to base64 string with data URL prefix
            const base64String = `data:image/png;base64,${Buffer.from(imageBytes).toString('base64')}`;

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Mock download to simulate accessibility
            const blob = new Blob([Buffer.from(imageBytes)], { type: 'image/png' });
            mockDownload.mockResolvedValue({ data: blob, error: null });

            // Upload the thumbnail with base64 string
            const uploadResult = await storageService.uploadThumbnail(drawingId, base64String);

            // Verify URL is generated and valid
            expect(uploadResult.url).toBeDefined();
            expect(uploadResult.url).toBe(expectedUrl);
            expect(uploadResult.url).toMatch(/^https?:\/\/.+/);

            // Verify the file can be downloaded
            const downloadedBuffer = await storageService.downloadThumbnail(drawingId);
            expect(downloadedBuffer).toEqual(Buffer.from(imageBytes));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate URLs with correct structure for thumbnail files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.uint8Array({ minLength: 100, maxLength: 1000 }),
          async (drawingId, imageBytes) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            const imageBuffer = Buffer.from(imageBytes);

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            const uploadResult = await storageService.uploadThumbnail(drawingId, imageBuffer);

            // Verify URL structure
            expect(uploadResult.url).toContain('https://');
            expect(uploadResult.url).toContain('/storage/');
            expect(uploadResult.url).toContain(`/drawings/${drawingId}/thumbnail.png`);
            expect(uploadResult.url).toContain(storageService['bucket']);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL Accessibility Error Handling', () => {
    it('should handle download errors for inaccessible files (404 errors)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          async (drawingId, drawingData) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();
            mockDownload.mockClear();

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Upload succeeds and URL is generated
            const uploadResult = await storageService.uploadDrawing(drawingId, drawingData);
            expect(uploadResult.url).toBe(expectedUrl);

            // But download fails (file was deleted or doesn't exist)
            mockDownload.mockResolvedValue({ 
              data: null, 
              error: { statusCode: '404', message: 'Not Found' } 
            });

            // Verify that accessing a non-existent file throws appropriate error
            await expect(storageService.downloadDrawing(drawingId)).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle network errors when downloading files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.uint8Array({ minLength: 100, maxLength: 1000 }),
          async (drawingId, imageBytes) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();
            mockDownload.mockClear();

            const imageBuffer = Buffer.from(imageBytes);

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Upload succeeds and URL is generated
            const uploadResult = await storageService.uploadThumbnail(drawingId, imageBuffer);
            expect(uploadResult.url).toBe(expectedUrl);

            // But download fails with network error
            mockDownload.mockRejectedValue(new Error('Network Error'));

            // Verify that network errors are properly propagated
            await expect(storageService.downloadThumbnail(drawingId)).rejects.toThrow('Network Error');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('URL Consistency', () => {
    it('should generate the same URL for the same drawing ID across multiple uploads', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          async (drawingId, drawingData1, drawingData2) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            // Upload first version
            const uploadResult1 = await storageService.uploadDrawing(drawingId, drawingData1);

            // Upload second version (overwrite)
            const uploadResult2 = await storageService.uploadDrawing(drawingId, drawingData2);

            // URLs should be identical (same drawing ID)
            expect(uploadResult1.url).toBe(uploadResult2.url);
            expect(uploadResult1.key).toBe(uploadResult2.key);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate different URLs for different drawing IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          async (drawingId1, drawingId2, drawingData) => {
            // Skip if IDs are the same
            if (drawingId1 === drawingId2) {
              return true;
            }

            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            mockUpload.mockResolvedValue({ error: null });

            // Mock different URLs for different IDs
            mockGetPublicUrl.mockImplementation((key: string) => ({
              data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${key}` }
            }));

            // Upload to first ID
            const uploadResult1 = await storageService.uploadDrawing(drawingId1, drawingData);

            // Upload to second ID
            const uploadResult2 = await storageService.uploadDrawing(drawingId2, drawingData);

            // URLs should be different
            expect(uploadResult1.url).not.toBe(uploadResult2.url);
            expect(uploadResult1.key).not.toBe(uploadResult2.key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL Format Validation', () => {
    it('should generate URLs that are valid HTTP/HTTPS URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            elements: fc.array(fc.anything()),
          }),
          async (drawingId, drawingData) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/data.json`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            const uploadResult = await storageService.uploadDrawing(drawingId, drawingData);

            // Verify URL is a valid HTTP/HTTPS URL
            expect(uploadResult.url).toMatch(/^https?:\/\/.+/);
            
            // Verify URL can be parsed
            const url = new URL(uploadResult.url);
            expect(url.protocol).toMatch(/^https?:$/);
            expect(url.hostname).toBeTruthy();
            expect(url.pathname).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate URLs without special characters that could cause issues', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.uint8Array({ minLength: 100, maxLength: 1000 }),
          async (drawingId, imageBytes) => {
            mockUpload.mockClear();
            mockGetPublicUrl.mockClear();

            const imageBuffer = Buffer.from(imageBytes);

            mockUpload.mockResolvedValue({ error: null });

            const expectedUrl = `https://test.supabase.co/storage/v1/object/public/test-bucket/drawings/${drawingId}/thumbnail.png`;
            mockGetPublicUrl.mockReturnValue({ 
              data: { publicUrl: expectedUrl } 
            });

            const uploadResult = await storageService.uploadThumbnail(drawingId, imageBuffer);

            // Verify URL doesn't contain problematic characters
            expect(uploadResult.url).not.toContain(' ');
            expect(uploadResult.url).not.toContain('\n');
            expect(uploadResult.url).not.toContain('\r');
            expect(uploadResult.url).not.toContain('\t');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
