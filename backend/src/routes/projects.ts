import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { Prisma } from '@prisma/client';

const router = Router();

// POST /api/projects - Create new project
router.post(
  '/',
  authenticateToken,
  validate([
    { field: 'name', required: true, minLength: 1, maxLength: 255 }
  ]),
  async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    const userId = req.userId!; // Non-null assertion - guaranteed by authenticateToken middleware

    try {
      // Create project using Prisma
      // The unique constraint on [userId, name] will automatically handle duplicates
      const project = await prisma.project.create({
        data: {
          name,
          userId,
          drawingCount: 0
        }
      });

      res.status(201).json({
        message: 'Project created successfully',
        project: {
          id: project.id,
          name: project.name,
          userId: project.userId,
          drawingCount: project.drawingCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      });
    } catch (error) {
      console.error('Create project error:', error);
      
      // Handle unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({
          error: 'Project already exists',
          message: 'A project with this name already exists'
        });
        return;
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create project'
      });
    }
  }
);

// GET /api/projects - Get all user projects with pagination
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!; // Non-null assertion - guaranteed by authenticateToken middleware
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200); // Max 200
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      // Get total count and paginated projects using Prisma
      const [totalCount, projects] = await Promise.all([
        prisma.project.count({
          where: { userId }
        }),
        prisma.project.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset
        })
      ]);

      res.json({
        projects: projects.map(project => ({
          id: project.id,
          name: project.name,
          userId: project.userId,
          drawingCount: project.drawingCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        })),
        count: projects.length,
        totalCount,
        hasMore: offset + projects.length < totalCount
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch projects'
      });
    }
  }
);

// GET /api/projects/:id - Get project by ID
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!; // Non-null assertion - guaranteed by authenticateToken middleware

    try {
      // Fetch project and verify ownership using Prisma
      const project = await prisma.project.findFirst({
        where: {
          id,
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

      res.json({
        project: {
          id: project.id,
          name: project.name,
          userId: project.userId,
          drawingCount: project.drawingCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch project'
      });
    }
  }
);

// PUT /api/projects/:id - Update project name
router.put(
  '/:id',
  authenticateToken,
  validate([
    { field: 'name', required: true, minLength: 1, maxLength: 255 }
  ]),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.userId!; // Non-null assertion - guaranteed by authenticateToken middleware

    try {
      // Verify ownership first
      const existingProject = await prisma.project.findUnique({
        where: { id }
      });

      if (!existingProject || existingProject.userId !== userId) {
        res.status(404).json({
          error: 'Project not found',
          message: 'The specified project does not exist or you do not have access to it'
        });
        return;
      }

      // Update project name using Prisma
      // The unique constraint on [userId, name] will automatically handle duplicates
      const project = await prisma.project.update({
        where: { id },
        data: { name }
      });

      res.json({
        message: 'Project updated successfully',
        project: {
          id: project.id,
          name: project.name,
          userId: project.userId,
          drawingCount: project.drawingCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      });
    } catch (error) {
      console.error('Update project error:', error);
      
      // Handle unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({
          error: 'Project name already exists',
          message: 'Another project with this name already exists'
        });
        return;
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update project'
      });
    }
  }
);

// DELETE /api/projects/:id - Delete project
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!; // Non-null assertion - guaranteed by authenticateToken middleware

    try {
      // Verify ownership and check drawing count using Prisma
      const project = await prisma.project.findUnique({
        where: { id }
      });

      if (!project || project.userId !== userId) {
        res.status(404).json({
          error: 'Project not found',
          message: 'The specified project does not exist or you do not have access to it'
        });
        return;
      }

      // Prevent deletion of projects with drawings
      if (project.drawingCount > 0) {
        res.status(400).json({
          error: 'Cannot delete project',
          message: `This project contains ${project.drawingCount} drawing(s). Please move or delete all drawings before deleting the project.`
        });
        return;
      }

      // Delete project using Prisma
      await prisma.project.delete({
        where: { id }
      });

      res.json({
        message: 'Project deleted successfully',
        id: project.id
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete project'
      });
    }
  }
);

export default router;
