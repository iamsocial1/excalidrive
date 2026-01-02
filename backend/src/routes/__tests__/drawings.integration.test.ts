import request from 'supertest';
import express, { Express } from 'express';
import { prisma } from '../../config/database';
import drawingsRouter from '../drawings';
import authRouter from '../auth';
import projectsRouter from '../projects';
import { errorHandler } from '../../middleware/errorHandler';

describe('Drawings API - Backward Compatibility Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let drawingId: string;

  beforeAll(async () => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/projects', projectsRouter);
    app.use('/api/drawings', drawingsRouter);
    app.use(errorHandler);

    // Create test user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });

    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Project ${Date.now()}`
      });

    projectId = projectResponse.body.project.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (drawingId) {
      await prisma.drawing.deleteMany({
        where: { userId }
      });
    }
    if (projectId) {
      await prisma.project.deleteMany({
        where: { userId }
      });
    }
    if (userId) {
      await prisma.user.delete({
        where: { id: userId }
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/drawings - Create drawing', () => {
    it('should create a new drawing with valid data', async () => {
      const drawingData = {
        name: 'Test Drawing',
        projectId: projectId,
        excalidrawData: {
          elements: [],
          appState: { viewBackgroundColor: '#ffffff' }
        },
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const response = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(drawingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Drawing created successfully');
      expect(response.body).toHaveProperty('drawing');
      expect(response.body.drawing).toMatchObject({
        name: drawingData.name,
        userId: userId,
        projectId: projectId,
        excalidrawData: drawingData.excalidrawData,
        thumbnail: drawingData.thumbnail,
        isPublic: false,
        publicShareId: null
      });
      expect(response.body.drawing).toHaveProperty('id');
      expect(response.body.drawing).toHaveProperty('createdAt');
      expect(response.body.drawing).toHaveProperty('updatedAt');
      expect(response.body.drawing).toHaveProperty('lastAccessedAt');

      // Store for later tests
      drawingId = response.body.drawing.id;
    });

    it('should return 404 error when project does not exist', async () => {
      const response = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Drawing',
          projectId: '00000000-0000-0000-0000-000000000000',
          excalidrawData: { elements: [] }
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/drawings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: projectId
          // Missing name and excalidrawData
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/drawings')
        .send({
          name: 'Test Drawing',
          projectId: projectId,
          excalidrawData: { elements: [] }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/drawings/:id - Get drawing by ID', () => {
    it('should retrieve an existing drawing', async () => {
      const response = await request(app)
        .get(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('drawing');
      expect(response.body.drawing).toMatchObject({
        id: drawingId,
        name: 'Test Drawing',
        userId: userId,
        projectId: projectId,
        isPublic: false
      });
      expect(response.body.drawing).toHaveProperty('excalidrawData');
      expect(response.body.drawing).toHaveProperty('thumbnail');
      expect(response.body.drawing).toHaveProperty('createdAt');
      expect(response.body.drawing).toHaveProperty('updatedAt');
      expect(response.body.drawing).toHaveProperty('lastAccessedAt');
    });

    it('should return 404 error when drawing does not exist', async () => {
      const response = await request(app)
        .get('/api/drawings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Drawing not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 error when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/drawings/${drawingId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/drawings/:id - Update drawing', () => {
    it('should update drawing name', async () => {
      const updatedName = 'Updated Drawing Name';
      const response = await request(app)
        .put(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: updatedName });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Drawing updated successfully');
      expect(response.body).toHaveProperty('drawing');
      expect(response.body.drawing).toMatchObject({
        id: drawingId,
        name: updatedName,
        userId: userId,
        projectId: projectId
      });
      expect(response.body.drawing).toHaveProperty('excalidrawData');
      expect(response.body.drawing).toHaveProperty('updatedAt');
    });

    it('should update excalidrawData', async () => {
      const updatedData = {
        elements: [{ type: 'rectangle', x: 0, y: 0 }],
        appState: { viewBackgroundColor: '#000000' }
      };
      const response = await request(app)
        .put(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ excalidrawData: updatedData });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Drawing updated successfully');
      expect(response.body.drawing.excalidrawData).toEqual(updatedData);
    });

    it('should update thumbnail', async () => {
      const newThumbnail = 'data:image/png;base64,newImageData';
      const response = await request(app)
        .put(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ thumbnail: newThumbnail });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Drawing updated successfully');
      expect(response.body.drawing.thumbnail).toBe(newThumbnail);
    });

    it('should return 404 error when drawing does not exist', async () => {
      const response = await request(app)
        .put('/api/drawings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Drawing not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 error when no fields provided', async () => {
      const response = await request(app)
        .put(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 error when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/drawings/${drawingId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/drawings/:id - Delete drawing', () => {
    it('should delete an existing drawing', async () => {
      const response = await request(app)
        .delete(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Drawing deleted successfully');
      expect(response.body).toHaveProperty('id', drawingId);

      // Verify drawing is deleted
      const getResponse = await request(app)
        .get(`/api/drawings/${drawingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 error when drawing does not exist', async () => {
      const response = await request(app)
        .delete('/api/drawings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Drawing not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 error when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/drawings/${drawingId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/drawings - List drawings', () => {
    beforeAll(async () => {
      // Create multiple test drawings
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/drawings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `List Test Drawing ${i}`,
            projectId: projectId,
            excalidrawData: { elements: [] }
          });
      }
    });

    it('should list recent drawings with pagination', async () => {
      const response = await request(app)
        .get('/api/drawings/recent?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('drawings');
      expect(Array.isArray(response.body.drawings)).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      expect(response.body.drawings.length).toBeGreaterThan(0);

      // Verify drawing structure
      const drawing = response.body.drawings[0];
      expect(drawing).toHaveProperty('id');
      expect(drawing).toHaveProperty('name');
      expect(drawing).toHaveProperty('userId', userId);
      expect(drawing).toHaveProperty('projectId');
      expect(drawing).toHaveProperty('thumbnail');
      expect(drawing).toHaveProperty('isPublic');
      expect(drawing).toHaveProperty('createdAt');
      expect(drawing).toHaveProperty('updatedAt');
      expect(drawing).toHaveProperty('lastAccessedAt');
    });

    it('should list drawings by project', async () => {
      const response = await request(app)
        .get(`/api/drawings/project/${projectId}?limit=10&offset=0`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('drawings');
      expect(Array.isArray(response.body.drawings)).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');

      // All drawings should belong to the project
      response.body.drawings.forEach((drawing: any) => {
        expect(drawing.projectId).toBe(projectId);
      });
    });

    it('should return 404 when project does not exist', async () => {
      const response = await request(app)
        .get('/api/drawings/project/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });

    it('should return 401 error when not authenticated', async () => {
      const response = await request(app)
        .get('/api/drawings/recent');

      expect(response.status).toBe(401);
    });
  });
});
