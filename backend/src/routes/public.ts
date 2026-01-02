import { Router, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET /api/public/:shareId - Get public drawing (no auth required)
router.get(
  '/:shareId',
  async (req, res: Response) => {
    const { shareId } = req.params;

    try {
      const drawing = await prisma.drawing.findUnique({
        where: {
          publicShareId: shareId
        },
        select: {
          id: true,
          name: true,
          excalidrawData: true,
          thumbnail: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true
        }
      });

      if (!drawing || !drawing.isPublic) {
        res.status(404).json({
          error: 'Drawing not found',
          message: 'The shared drawing does not exist or is no longer public'
        });
        return;
      }

      res.json({
        drawing: {
          id: drawing.id,
          name: drawing.name,
          excalidrawData: drawing.excalidrawData,
          thumbnail: drawing.thumbnail,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt
        }
      });
    } catch (error) {
      console.error('Get public drawing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch public drawing'
      });
    }
  }
);

export default router;
