import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import crypto from 'crypto';

const router = Router();

// POST /api/drawings - Create new drawing
router.post(
  '/',
  authenticateToken,
  validate([
    { field: 'name', required: true, minLength: 1, maxLength: 255 },
    { field: 'projectId', required: true },
    { field: 'excalidrawData', required: true },
    { field: 'thumbnail', required: false }
  ]),
  async (req: AuthRequest, res: Response) => {
    const { name, projectId, excalidrawData, thumbnail } = req.body;
    const userId = req.userId!;

    try {
      // Verify project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: userId
        }
      });

      if (!project) {
        res.status(404).json({
          error: 'Project not found',
          message: 'The specified project does not exist or you do not have access to it'
        });
        return;
      }

      // Create drawing
      const drawing = await prisma.drawing.create({
        data: {
          name,
          userId,
          projectId,
          excalidrawData,
          thumbnail: thumbnail || null,
          lastAccessedAt: new Date()
        }
      });

      res.status(201).json({
        message: 'Drawing created successfully',
        drawing: {
          id: drawing.id,
          name: drawing.name,
          userId: drawing.userId,
          projectId: drawing.projectId,
          excalidrawData: drawing.excalidrawData,
          thumbnail: drawing.thumbnail,
          isPublic: drawing.isPublic,
          publicShareId: drawing.publicShareId,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          lastAccessedAt: drawing.lastAccessedAt
        }
      });
    } catch (error) {
      console.error('Create drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create drawing'
      });
    }
  }
);

// GET /api/drawings/recent - Get recent drawings with pagination
// NOTE: This MUST come BEFORE /:id route to avoid matching "recent" as an ID
router.get(
  '/recent',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      // Get total count for pagination
      const totalCount = await prisma.drawing.count({
        where: {
          userId
        }
      });

      // Fetch paginated drawings
      const drawings = await prisma.drawing.findMany({
        where: {
          userId
        },
        orderBy: {
          lastAccessedAt: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          userId: true,
          projectId: true,
          thumbnail: true,
          isPublic: true,
          publicShareId: true,
          createdAt: true,
          updatedAt: true,
          lastAccessedAt: true
        }
      });

      res.json({
        drawings: drawings.map(drawing => ({
          id: drawing.id,
          name: drawing.name,
          userId: drawing.userId,
          projectId: drawing.projectId,
          thumbnail: drawing.thumbnail,
          isPublic: drawing.isPublic,
          publicShareId: drawing.publicShareId,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          lastAccessedAt: drawing.lastAccessedAt
        })),
        count: drawings.length,
        totalCount,
        hasMore: offset + drawings.length < totalCount
      });
    } catch (error) {
      console.error('Get recent drawings error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch recent drawings'
      });
    }
  }
);

// GET /api/drawings/project/:projectId - Get drawings by project with pagination
// NOTE: This MUST come BEFORE /:id route to avoid matching "project" as an ID
router.get(
  '/project/:projectId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId
        }
      });

      if (!project) {
        res.status(404).json({
          error: 'Project not found',
          message: 'The specified project does not exist or you do not have access to it'
        });
        return;
      }

      // Get total count for pagination
      const totalCount = await prisma.drawing.count({
        where: {
          projectId,
          userId
        }
      });

      // Fetch paginated drawings
      const drawings = await prisma.drawing.findMany({
        where: {
          projectId,
          userId
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          userId: true,
          projectId: true,
          thumbnail: true,
          isPublic: true,
          publicShareId: true,
          createdAt: true,
          updatedAt: true,
          lastAccessedAt: true
        }
      });

      res.json({
        drawings: drawings.map(drawing => ({
          id: drawing.id,
          name: drawing.name,
          userId: drawing.userId,
          projectId: drawing.projectId,
          thumbnail: drawing.thumbnail,
          isPublic: drawing.isPublic,
          publicShareId: drawing.publicShareId,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          lastAccessedAt: drawing.lastAccessedAt
        })),
        count: drawings.length,
        totalCount,
        hasMore: offset + drawings.length < totalCount
      });
    } catch (error) {
      console.error('Get project drawings error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch project drawings'
      });
    }
  }
);



// GET /api/drawings/:id - Get drawing by ID
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    try {
      // Fetch drawing and verify ownership
      const drawing = await prisma.drawing.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!drawing) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The specified drawing does not exist or you do not have access to it'
        });
        return;
      }

      // Update last accessed timestamp
      await prisma.drawing.update({
        where: { id },
        data: { lastAccessedAt: new Date() }
      });

      res.json({
        drawing: {
          id: drawing.id,
          name: drawing.name,
          userId: drawing.userId,
          projectId: drawing.projectId,
          excalidrawData: drawing.excalidrawData,
          thumbnail: drawing.thumbnail,
          isPublic: drawing.isPublic,
          publicShareId: drawing.publicShareId,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          lastAccessedAt: drawing.lastAccessedAt
        }
      });
    } catch (error) {
      console.error('Get drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch drawing'
      });
    }
  }
);

// PUT /api/drawings/:id - Update drawing
router.put(
  '/:id',
  authenticateToken,
  validate([
    { field: 'name', required: false, minLength: 1, maxLength: 255 },
    { field: 'excalidrawData', required: false },
    { field: 'thumbnail', required: false }
  ]),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, excalidrawData, thumbnail } = req.body;
    const userId = req.userId!;

    if (!name && !excalidrawData && !thumbnail) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'At least one field (name, excalidrawData, or thumbnail) must be provided'
      });
      return;
    }

    try {
      // Verify ownership
      const existingDrawing = await prisma.drawing.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingDrawing) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The specified drawing does not exist or you do not have access to it'
        });
        return;
      }

      // Build update data dynamically
      const updateData: any = {
        lastAccessedAt: new Date()
      };

      if (name) {
        updateData.name = name;
      }

      if (excalidrawData) {
        updateData.excalidrawData = excalidrawData;
      }

      if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      }

      // Update drawing
      const drawing = await prisma.drawing.update({
        where: { id },
        data: updateData
      });

      res.json({
        message: 'Drawing updated successfully',
        drawing: {
          id: drawing.id,
          name: drawing.name,
          userId: drawing.userId,
          projectId: drawing.projectId,
          excalidrawData: drawing.excalidrawData,
          thumbnail: drawing.thumbnail,
          isPublic: drawing.isPublic,
          publicShareId: drawing.publicShareId,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          lastAccessedAt: drawing.lastAccessedAt
        }
      });
    } catch (error) {
      console.error('Update drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update drawing'
      });
    }
  }
);

// DELETE /api/drawings/:id - Delete drawing
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    try {
      // Verify ownership and delete
      const drawing = await prisma.drawing.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!drawing) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The specified drawing does not exist or you do not have access to it'
        });
        return;
      }

      await prisma.drawing.delete({
        where: { id }
      });

      res.json({
        message: 'Drawing deleted successfully',
        id: drawing.id
      });
    } catch (error) {
      console.error('Delete drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete drawing'
      });
    }
  }
);

// PUT /api/drawings/:id/move - Move drawing to different project
router.put(
  '/:id/move',
  authenticateToken,
  validate([
    { field: 'targetProjectId', required: true }
  ]),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { targetProjectId } = req.body;
    const userId = req.userId!;

    try {
      // Verify drawing ownership
      const drawing = await prisma.drawing.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!drawing) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The specified drawing does not exist or you do not have access to it'
        });
        return;
      }

      const currentProjectId = drawing.projectId;

      // Check if already in target project
      if (currentProjectId === targetProjectId) {
        res.status(400).json({
          error: 'Invalid operation',
          message: 'Drawing is already in the target project'
        });
        return;
      }

      // Verify target project ownership
      const targetProject = await prisma.project.findFirst({
        where: {
          id: targetProjectId,
          userId
        }
      });

      if (!targetProject) {
        res.status(404).json({
          error: 'Target project not found',
          message: 'The target project does not exist or you do not have access to it'
        });
        return;
      }

      // Move drawing
      const updatedDrawing = await prisma.drawing.update({
        where: { id },
        data: { projectId: targetProjectId },
        select: {
          id: true,
          name: true,
          userId: true,
          projectId: true,
          thumbnail: true,
          isPublic: true,
          publicShareId: true,
          createdAt: true,
          updatedAt: true,
          lastAccessedAt: true
        }
      });

      res.json({
        message: 'Drawing moved successfully',
        drawing: {
          id: updatedDrawing.id,
          name: updatedDrawing.name,
          userId: updatedDrawing.userId,
          projectId: updatedDrawing.projectId,
          thumbnail: updatedDrawing.thumbnail,
          isPublic: updatedDrawing.isPublic,
          publicShareId: updatedDrawing.publicShareId,
          createdAt: updatedDrawing.createdAt,
          updatedAt: updatedDrawing.updatedAt,
          lastAccessedAt: updatedDrawing.lastAccessedAt
        }
      });
    } catch (error) {
      console.error('Move drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to move drawing'
      });
    }
  }
);

// POST /api/drawings/:id/share - Generate public share link
router.post(
  '/:id/share',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    try {
      // Verify ownership
      const drawing = await prisma.drawing.findFirst({
        where: {
          id,
          userId
        },
        select: {
          id: true,
          publicShareId: true
        }
      });

      if (!drawing) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The specified drawing does not exist or you do not have access to it'
        });
        return;
      }

      // If already has a share ID, return it
      if (drawing.publicShareId) {
        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/${drawing.publicShareId}`;
        res.json({
          message: 'Public share link retrieved',
          shareId: drawing.publicShareId,
          shareUrl
        });
        return;
      }

      // Generate cryptographically secure share ID
      const shareId = crypto.randomBytes(16).toString('hex');

      // Update drawing with share ID
      await prisma.drawing.update({
        where: { id },
        data: {
          isPublic: true,
          publicShareId: shareId
        }
      });

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/${shareId}`;

      res.json({
        message: 'Public share link created successfully',
        shareId,
        shareUrl
      });
    } catch (error) {
      console.error('Create share link error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create public share link'
      });
    }
  }
);

export default router;
