import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all monitored users (admin only)
router.get('/monitored-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const monitored = await prisma.monitoredUser.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(monitored);
  } catch (error) {
    console.error('Error fetching monitored users:', error);
    res.status(500).json({ error: 'Failed to fetch monitored users' });
  }
});

export default router; 