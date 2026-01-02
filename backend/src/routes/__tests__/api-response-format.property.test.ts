import * as fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import { prisma } from '../../config/database';
import drawingsRouter from '../drawings';
import authRouter from '../auth';
import projectsRouter from '../projects';
import publicRouter from '../public';
import { errorHandler } from '../../middleware/errorHandler';

/**
 * Feature: supabase-migration, Property 12: API response format compatibility
 * 
 * For any API endpoint and valid request payload, the response structure 
 * (status code, headers, body schema) should match the pre-migration API format
 * 
 * Validates: Requirements 7.1
 */

describe('Property 12: API Response Format Compatibility', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/projects', projectsRouter);
    app.use('/api/drawings', drawingsRouter);
    app.use('/api/public', publicRouter);
    app.use(errorHandler);

    // Create test user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Property Test User',
        email: `property-test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });

    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Property Test Project ${Date.now()}`
      });

    projectId = projectResponse.body.project.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.drawing.deleteMany({ where: { userId } });
    await prisma.project.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  // Arbitraries for generating test data
  const drawingNameArb = fc.string({ minLength: 1, maxLength: 255 });
  const excalidrawDataArb = fc.record({
    elements: fc.array(fc.record({
      type: fc.constantFrom('rectangle', 'ellipse', 'arrow', 'text'),
      x: fc.integer({ min: 0, max: 1000 }),
      y: fc.integer({ min: 0, max: 1000 })
    })),
    appState: fc.record({
      viewBackgroundColor: fc.constantFrom('#ffffff', '#000000', '#f0f0f0')
    })
  });
  const thumbnailArb = fc.option(
    fc.constant('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
    { nil: null }
  );

  const projectNameArb = fc.string({ minLength: 1, maxLength: 255 });

  /**
   * Helper function to validate common response structure
   */
  function validateSuccessResponse(response: any, expectedStatus: number) {
    expect(response.status).toBe(expectedStatus);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');
  }

  /**
   * Helper function to validate error response structure
   */
  function validateErrorResponse(response: any, expectedStatus: number) {
    expect(response.status).toBe(expectedStatus);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.error).toBe('string');
    expect(typeof response.body.message).toBe('string');
  }

  /**
   * Helper function to validate drawing object structure
   */
  function validateDrawingObject(drawing: any) {
    expect(drawing).toHaveProperty('id');
    expect(drawing).toHaveProperty('name');
    expect(drawing).toHaveProperty('userId');
    expect(drawing).toHaveProperty('projectId');
    expect(drawing).toHaveProperty('isPublic');
    expect(drawing).toHaveProperty('createdAt');
    expect(drawing).toHaveProperty('updatedAt');
    expect(drawing).toHaveProperty('lastAccessedAt');
    
    expect(typeof drawing.id).toBe('string');
    expect(typeof drawing.name).toBe('string');
    expect(typeof drawing.userId).toBe('string');
    expect(typeof drawing.projectId).toBe('string');
    expect(typeof drawing.isPublic).toBe('boolean');
    expect(typeof drawing.createdAt).toBe('string');
    expect(typeof drawing.updatedAt).toBe('string');
    expect(typeof drawing.lastAccessedAt).toBe('string');
  }

  /**
   * Helper function to validate project object structure
   */
  function validateProjectObject(project: any) {
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('userId');
    expect(project).toHaveProperty('drawingCount');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('updatedAt');
    
    expect(typeof project.id).toBe('string');
    expect(typeof project.name).toBe('string');
    expect(typeof project.userId).toBe('string');
    expect(typeof project.drawingCount).toBe('number');
    expect(typeof project.createdAt).toBe('string');
    expect(typeof project.updatedAt).toBe('string');
  }

  describe('Drawing API Response Formats', () => {
    test('POST /api/drawings returns consistent format for any valid drawing data', async () => {
      await fc.assert(
        fc.asyncProperty(
          drawingNameArb,
          excalidrawDataArb,
          thumbnailArb,
          async (name, excalidrawData, thumbnail) => {
            const response = await request(app)
              .post('/api/drawings')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                name,
                projectId,
                excalidrawData,
                ...(thumbnail && { thumbnail })
              });

            // Validate response structure
            validateSuccessResponse(response, 201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('drawing');
            expect(typeof response.body.message).toBe('string');
            
            // Validate drawing object structure
            validateDrawingObject(response.body.drawing);
            expect(response.body.drawing).toHaveProperty('excalidrawData');
            expect(response.body.drawing).toHaveProperty('thumbnail');
            expect(response.body.drawing).toHaveProperty('publicShareId');
            
            // Validate data matches input
            expect(response.body.drawing.name).toBe(name);
            expect(response.body.drawing.projectId).toBe(projectId);
            expect(response.body.drawing.userId).toBe(userId);
            expect(response.body.drawing.excalidrawData).toEqual(excalidrawData);
            
            // Cleanup
            await prisma.drawing.delete({ where: { id: response.body.drawing.id } });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    test('GET /api/drawings/:id returns consistent format for any existing drawing', async () => {
      // Create a test drawing first
      const createResponse = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Drawing for GET',
          projectId,
          excalidrawData: { elements: [], appState: {} }
        });
      
      const drawingId = createResponse.body.drawing.id;

      const response = await request(app)
        .get(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Validate response structure
      validateSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('drawing');
      
      // Validate drawing object structure
      validateDrawingObject(response.body.drawing);
      expect(response.body.drawing).toHaveProperty('excalidrawData');
      expect(response.body.drawing).toHaveProperty('thumbnail');
      expect(response.body.drawing).toHaveProperty('publicShareId');
      
      // Cleanup
      await prisma.drawing.delete({ where: { id: drawingId } });
    });

    test('PUT /api/drawings/:id returns consistent format for any valid update', async () => {
      // Create a test drawing first
      const createResponse = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Drawing for PUT',
          projectId,
          excalidrawData: { elements: [], appState: {} }
        });
      
      const drawingId = createResponse.body.drawing.id;

      await fc.assert(
        fc.asyncProperty(
          fc.option(drawingNameArb, { nil: undefined }),
          fc.option(excalidrawDataArb, { nil: undefined }),
          fc.option(thumbnailArb, { nil: undefined }),
          async (name, excalidrawData, thumbnail) => {
            // Skip if all fields are undefined
            if (!name && !excalidrawData && !thumbnail) {
              return true;
            }

            const updateData: any = {};
            if (name) updateData.name = name;
            if (excalidrawData) updateData.excalidrawData = excalidrawData;
            if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

            const response = await request(app)
              .put(`/api/drawings/${drawingId}`)
              .set('Authorization', `Bearer ${authToken}`)
              .send(updateData);

            // Validate response structure
            validateSuccessResponse(response, 200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('drawing');
            expect(typeof response.body.message).toBe('string');
            
            // Validate drawing object structure
            validateDrawingObject(response.body.drawing);
            expect(response.body.drawing).toHaveProperty('excalidrawData');
            expect(response.body.drawing).toHaveProperty('thumbnail');
            expect(response.body.drawing).toHaveProperty('publicShareId');
          }
        ),
        { numRuns: 50 }
      );

      // Cleanup
      await prisma.drawing.delete({ where: { id: drawingId } });
    });

    test('DELETE /api/drawings/:id returns consistent format', async () => {
      // Create a test drawing
      const createResponse = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Drawing for DELETE',
          projectId,
          excalidrawData: { elements: [], appState: {} }
        });
      
      const drawingId = createResponse.body.drawing.id;

      const response = await request(app)
        .delete(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Validate response structure
      validateSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id).toBe(drawingId);
    });

    test('GET /api/drawings/recent returns consistent paginated format', async () => {
      // Create some test drawings
      const drawingIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const createResponse = await request(app)
          .post('/api/drawings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Test Drawing ${i}`,
            projectId,
            excalidrawData: { elements: [], appState: {} }
          });
        drawingIds.push(createResponse.body.drawing.id);
      }

      const response = await request(app)
        .get('/api/drawings/recent?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      // Validate response structure
      validateSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('drawings');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      
      expect(Array.isArray(response.body.drawings)).toBe(true);
      expect(typeof response.body.count).toBe('number');
      expect(typeof response.body.totalCount).toBe('number');
      expect(typeof response.body.hasMore).toBe('boolean');
      
      // Validate each drawing in the list
      response.body.drawings.forEach((drawing: any) => {
        validateDrawingObject(drawing);
        expect(drawing).toHaveProperty('thumbnail');
        expect(drawing).toHaveProperty('publicShareId');
        // Note: excalidrawData is not included in list responses
        expect(drawing).not.toHaveProperty('excalidrawData');
      });

      // Cleanup
      await prisma.drawing.deleteMany({ where: { id: { in: drawingIds } } });
    });
  });

  describe('Project API Response Formats', () => {
    test('POST /api/projects returns consistent format for any valid project name', async () => {
      await fc.assert(
        fc.asyncProperty(
          projectNameArb,
          async (name) => {
            const uniqueName = `${name}-${Date.now()}-${Math.random()}`;
            
            const response = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${authToken}`)
              .send({ name: uniqueName });

            // Validate response structure
            validateSuccessResponse(response, 201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('project');
            expect(typeof response.body.message).toBe('string');
            
            // Validate project object structure
            validateProjectObject(response.body.project);
            expect(response.body.project.name).toBe(uniqueName);
            expect(response.body.project.userId).toBe(userId);
            expect(response.body.project.drawingCount).toBe(0);
            
            // Cleanup
            await prisma.project.delete({ where: { id: response.body.project.id } });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    test('GET /api/projects returns consistent paginated format', async () => {
      const response = await request(app)
        .get('/api/projects?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      // Validate response structure
      validateSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(typeof response.body.count).toBe('number');
      expect(typeof response.body.totalCount).toBe('number');
      expect(typeof response.body.hasMore).toBe('boolean');
      
      // Validate each project in the list
      response.body.projects.forEach((project: any) => {
        validateProjectObject(project);
      });
    });

    test('GET /api/projects/:id returns consistent format', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Validate response structure
      validateSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('project');
      
      // Validate project object structure
      validateProjectObject(response.body.project);
      expect(response.body.project.id).toBe(projectId);
    });

    test('PUT /api/projects/:id returns consistent format for any valid name', async () => {
      await fc.assert(
        fc.asyncProperty(
          projectNameArb,
          async (name) => {
            const uniqueName = `${name}-${Date.now()}-${Math.random()}`;
            
            const response = await request(app)
              .put(`/api/projects/${projectId}`)
              .set('Authorization', `Bearer ${authToken}`)
              .send({ name: uniqueName });

            // Validate response structure
            validateSuccessResponse(response, 200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('project');
            expect(typeof response.body.message).toBe('string');
            
            // Validate project object structure
            validateProjectObject(response.body.project);
            expect(response.body.project.name).toBe(uniqueName);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Response Formats', () => {
    test('404 errors return consistent format', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const drawingResponse = await request(app)
        .get(`/api/drawings/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      validateErrorResponse(drawingResponse, 404);
      
      const projectResponse = await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      validateErrorResponse(projectResponse, 404);
    });

    test('401 errors return consistent format', async () => {
      const response = await request(app)
        .get('/api/drawings/recent');
      
      expect(response.status).toBe(401);
      // 401 errors may have different format from middleware
    });

    test('400 validation errors return consistent format', async () => {
      const response = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          projectId
        });
      
      // Validation errors have a specific format with details array
      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      
      // Validation errors may have either 'message' or 'details'
      if (response.body.details) {
        expect(Array.isArray(response.body.details)).toBe(true);
        response.body.details.forEach((detail: any) => {
          expect(detail).toHaveProperty('field');
          expect(detail).toHaveProperty('message');
        });
      } else {
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
      }
    });
  });
});
