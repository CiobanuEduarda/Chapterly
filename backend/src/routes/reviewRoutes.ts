import express from 'express';
import * as reviewRepository from '../repositories/reviewRepository';

const router = express.Router();

// Get all reviews with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      bookId: req.query.bookId ? parseInt(req.query.bookId as string) : undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      minRating: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
      maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined,
    };
    const sort = req.query.sort ? {
      field: (req.query.sort as string).split(':')[0] as 'rating' | 'createdAt',
      order: (req.query.sort as string).split(':')[1] as 'asc' | 'desc',
    } : undefined;

    const result = await reviewRepository.getReviews(page, limit, filters, sort);
    res.json(result);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Get a review by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const review = await reviewRepository.getReviewById(id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    console.error(`Error getting review with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get review' });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { content, rating, bookId } = req.body;
    
    if (!content || !rating || !bookId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = await reviewRepository.createReview({ content, rating, bookId });
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content, rating } = req.body;
    
    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = await reviewRepository.updateReview(id, { content, rating });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    console.error(`Error updating review with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await reviewRepository.deleteReview(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting review with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get reviews for a specific book
router.get('/book/:bookId', async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort ? {
      field: (req.query.sort as string).split(':')[0] as 'rating' | 'createdAt',
      order: (req.query.sort as string).split(':')[1] as 'asc' | 'desc',
    } : undefined;

    const result = await reviewRepository.getBookReviews(bookId, page, limit, sort);
    res.json(result);
  } catch (error) {
    console.error(`Error getting reviews for book ${req.params.bookId}:`, error);
    res.status(500).json({ error: 'Failed to get book reviews' });
  }
});

export default router; 