import * as fc from 'fast-check';

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock dotenv to prevent it from loading .env file during tests
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Storage Configuration', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Property 2: Environment variable validation', () => {
    /**
     * Feature: supabase-migration, Property 2: Environment variable validation
     * Validates: Requirements 1.4, 3.2
     * 
     * For any subset of missing required Supabase environment variables,
     * the validation function should throw an error listing those specific missing variables.
     * 
     * Note: SUPABASE_STORAGE_BUCKET has a default value, so we only test URL and KEY.
     */
    it('should throw an error listing all missing required environment variables', () => {
      fc.assert(
        fc.property(
          // Generate a subset of required variables to be missing (only URL and KEY, bucket has default)
          fc.subarray(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], { minLength: 1 }),
          (missingVars) => {
            // Set up environment with some variables missing
            const allVars = {
              SUPABASE_URL: 'https://test.supabase.co',
              SUPABASE_SERVICE_ROLE_KEY: 'test-key',
            };

            // Clear all Supabase env vars first
            delete process.env.SUPABASE_URL;
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.SUPABASE_STORAGE_BUCKET;

            // Set only the variables that should be present
            Object.keys(allVars).forEach(varName => {
              if (!missingVars.includes(varName)) {
                process.env[varName] = allVars[varName as keyof typeof allVars];
              }
            });

            // Re-import the module to get fresh config with new env vars
            jest.resetModules();
            const { storageConfig, validateStorageConfig: freshValidate } = require('../storage');

            // Attempt validation and expect it to throw
            try {
              freshValidate();
              // If we get here, validation didn't throw when it should have
              return false;
            } catch (error: any) {
              // Verify that the error message contains all missing variable names
              const errorMessage = error.message;
              
              // Map environment variable names to config keys
              const varToConfigKey: Record<string, string> = {
                'SUPABASE_URL': 'supabaseUrl',
                'SUPABASE_SERVICE_ROLE_KEY': 'supabaseKey',
              };

              // Check that all missing variables are mentioned in the error
              const allMissingMentioned = missingVars.every(varName => {
                const configKey = varToConfigKey[varName];
                return errorMessage.includes(configKey);
              });

              return allMissingMentioned;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not throw when all required environment variables are present', () => {
      fc.assert(
        fc.property(
          fc.record({
            url: fc.webUrl({ withFragments: false, withQueryParameters: false }),
            key: fc.string({ minLength: 10, maxLength: 100 }),
            bucket: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          }),
          (config) => {
            // Clear all Supabase env vars first
            delete process.env.SUPABASE_URL;
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.SUPABASE_STORAGE_BUCKET;

            // Set all required environment variables
            process.env.SUPABASE_URL = config.url;
            process.env.SUPABASE_SERVICE_ROLE_KEY = config.key;
            process.env.SUPABASE_STORAGE_BUCKET = config.bucket;

            // Re-import the module to get fresh config with new env vars
            jest.resetModules();
            const { validateStorageConfig: freshValidate } = require('../storage');

            // Validation should not throw
            try {
              freshValidate();
              return true;
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw when required environment variables are missing (URL and KEY)', () => {
      // Clear required environment variables (bucket has a default)
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      // Re-import the module to get fresh config
      jest.resetModules();
      const { validateStorageConfig: freshValidate } = require('../storage');

      // Validation should throw
      expect(() => freshValidate()).toThrow();
      
      // Error should mention the two missing config keys (bucket has default)
      try {
        freshValidate();
      } catch (error: any) {
        expect(error.message).toContain('supabaseUrl');
        expect(error.message).toContain('supabaseKey');
        // bucket has a default value, so it won't be in the error
      }
    });
  });

  describe('validateStorageConfig unit tests', () => {
    it('should validate successfully with complete configuration', () => {
      // Clear all Supabase env vars first
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
      process.env.SUPABASE_STORAGE_BUCKET = 'test-bucket';

      jest.resetModules();
      const { validateStorageConfig: freshValidate } = require('../storage');

      expect(() => freshValidate()).not.toThrow();
    });

    it('should throw error when SUPABASE_URL is missing', () => {
      // Clear all Supabase env vars first
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
      process.env.SUPABASE_STORAGE_BUCKET = 'test-bucket';

      jest.resetModules();
      const { validateStorageConfig: freshValidate } = require('../storage');

      expect(() => freshValidate()).toThrow(/supabaseUrl/);
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      // Clear all Supabase env vars first
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_STORAGE_BUCKET = 'test-bucket';

      jest.resetModules();
      const { validateStorageConfig: freshValidate } = require('../storage');

      expect(() => freshValidate()).toThrow(/supabaseKey/);
    });

    it('should not throw when SUPABASE_STORAGE_BUCKET is missing (has default)', () => {
      // Clear all Supabase env vars first
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      jest.resetModules();
      const { validateStorageConfig: freshValidate, storageConfig } = require('../storage');

      // Should not throw because bucket has a default value
      expect(() => freshValidate()).not.toThrow();
      // Verify the default bucket value is used
      expect(storageConfig.bucket).toBe('excalidraw-drawings');
    });

    it('should throw error with descriptive message listing all missing variables', () => {
      // Clear all Supabase env vars first
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      process.env.SUPABASE_STORAGE_BUCKET = 'test-bucket';

      jest.resetModules();
      const { validateStorageConfig: freshValidate } = require('../storage');

      try {
        freshValidate();
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Missing required storage configuration');
        expect(error.message).toContain('supabaseUrl');
        expect(error.message).toContain('supabaseKey');
        expect(error.message).not.toContain('bucket');
      }
    });
  });
});
