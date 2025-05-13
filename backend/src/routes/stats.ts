import express from 'express';
import { getBookStatistics, getBooksWithStats } from '../repositories/statsRepository';

const router = express.Router();

// Get comprehensive book statistics
router.get('/books', async (req, res) => {
  try {
    const stats = await getBookStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching book statistics:', error);
    res.status(500).json({ error: 'Failed to fetch book statistics' });
  }
});

// Get paginated books with their statistics
router.get('/books/paginated', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const books = await getBooksWithStats(page, pageSize);
    res.json(books);
  } catch (error) {
    console.error('Error fetching paginated books:', error);
    res.status(500).json({ error: 'Failed to fetch paginated books' });
  }
});

export default router; 