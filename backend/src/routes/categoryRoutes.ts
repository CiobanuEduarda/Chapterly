import express from 'express';
import * as categoryRepository from '../repositories/categoryRepository';

const router = express.Router();

// Get all categories with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      name: req.query.name as string,
      hasBooks: req.query.hasBooks === 'true',
    };
    const sort = req.query.sort ? {
      field: (req.query.sort as string).split(':')[0] as 'name' | 'createdAt',
      order: (req.query.sort as string).split(':')[1] as 'asc' | 'desc',
    } : undefined;

    const result = await categoryRepository.getCategories(page, limit, filters, sort);
    res.json(result);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get a category by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await categoryRepository.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(`Error getting category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const category = await categoryRepository.createCategory({ name, description });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    
    const category = await categoryRepository.updateCategory(id, { name, description });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(`Error updating category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await categoryRepository.deleteCategory(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Add a book to a category
router.post('/:categoryId/books/:bookId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const bookId = parseInt(req.params.bookId);
    
    await categoryRepository.addBookToCategory(bookId, categoryId);
    res.status(204).send();
  } catch (error) {
    console.error('Error adding book to category:', error);
    res.status(500).json({ error: 'Failed to add book to category' });
  }
});

// Remove a book from a category
router.delete('/:categoryId/books/:bookId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const bookId = parseInt(req.params.bookId);
    
    await categoryRepository.removeBookFromCategory(bookId, categoryId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing book from category:', error);
    res.status(500).json({ error: 'Failed to remove book from category' });
  }
});

// Get categories for a specific book
router.get('/book/:bookId', async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const categories = await categoryRepository.getBookCategories(bookId);
    res.json(categories);
  } catch (error) {
    console.error(`Error getting categories for book ${req.params.bookId}:`, error);
    res.status(500).json({ error: 'Failed to get book categories' });
  }
});

export default router; 