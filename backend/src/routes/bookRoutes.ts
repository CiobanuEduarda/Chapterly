import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireUser } from '../middleware/roleAuth';
import * as bookRepository from '../repositories/bookRepository';
import { logAction } from '../utils/logAction';

const router = express.Router();
const prisma = new PrismaClient();

// Get all books with pagination and filtering
router.get('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string;
    const genre = req.query.genre as string;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const sort = req.query.sort as string;

    const skip = (page - 1) * limit;

    // Build where clause based on filter and role
    const where: Prisma.BookWhereInput = {
      ...(filter ? {
        OR: [
          { title: { contains: filter, mode: Prisma.QueryMode.insensitive } },
          { author: { contains: filter, mode: Prisma.QueryMode.insensitive } },
          { genre: { contains: filter, mode: Prisma.QueryMode.insensitive } }
        ]
      } : {}),
      ...(genre ? { genre } : {}),
      ...(rating ? { rating: { gte: rating } } : {}),
      // Only show user's books unless admin
      ...(userRole !== 'ADMIN' ? { userId } : {})
    };

    // Build orderBy clause based on sort
    const orderBy: Prisma.BookOrderByWithRelationInput = sort ? {
      [sort.split(':')[0]]: sort.split(':')[1] as Prisma.SortOrder
    } : { id: 'asc' };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          reviews: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }),
      prisma.book.count({ where })
    ]);

    // Log read action (list)
    await logAction({
      userId,
      action: 'READ',
      entity: 'Book',
    });

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get a single book by ID
router.get('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const id = parseInt(req.params.id);
    
    const book = await prisma.book.findFirst({
      where: { 
        id,
        ...(userRole !== 'ADMIN' ? { userId } : {})
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        reviews: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Log read action (single)
    await logAction({
      userId,
      action: 'READ',
      entity: 'Book',
      entityId: id
    });

    res.json(book);
  } catch (error) {
    console.error(`Error fetching book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create a new book
router.post('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId || typeof userId !== 'number') {
      return res.status(401).json({ error: 'Unauthorized: userId missing or invalid' });
    }
    const { title, author, genre, price, rating } = req.body;
    if (!title || !author || !genre || typeof price !== 'number' || typeof rating !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid book fields' });
    }
    const bookData = { title, author, genre, price, rating };
    const book = await bookRepository.createBook(bookData, userId);
    // Log create action
    await logAction({
      userId,
      action: 'CREATE',
      entity: 'Book',
      entityId: book.id
    });
    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update a book
router.put('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const id = parseInt(req.params.id);
    const { title, author, genre, price, rating, categoryIds } = req.body;

    // Debug logging
    console.log('UPDATE attempt:', { userId, userRole, bookId: id });

    // Check ownership or admin status
    const bookToUpdate = await prisma.book.findFirst({ 
      where: { 
        id,
        ...(userRole !== 'ADMIN' ? { userId } : {})
      }
    });
    console.log('Book found for update:', bookToUpdate);
    
    if (!bookToUpdate) {
      return res.status(404).json({ error: 'Book not found or not owned by user' });
    }

    // First, delete existing category relationships
    if (categoryIds) {
      await prisma.bookCategory.deleteMany({
        where: { bookId: id }
      });
    }

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        genre,
        price,
        rating,
        categories: categoryIds ? {
          create: categoryIds.map((categoryId: number) => ({
            category: {
              connect: { id: categoryId }
            }
          }))
        } : undefined
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Log update action
    await logAction({
      userId,
      action: 'UPDATE',
      entity: 'Book',
      entityId: id
    });

    res.json(book);
  } catch (error) {
    console.error(`Error updating book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete a book
router.delete('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const id = parseInt(req.params.id);

    // Debug logging
    console.log('DELETE attempt:', { userId, userRole, bookId: id });

    // Check ownership or admin status
    const bookToDelete = await prisma.book.findFirst({ 
      where: { 
        id,
        ...(userRole !== 'ADMIN' ? { userId } : {})
      }
    });
    console.log('Book found for delete:', bookToDelete);
    
    if (!bookToDelete) {
      return res.status(404).json({ error: 'Book not found or not owned by user' });
    }

    await prisma.book.delete({
      where: { id }
    });

    // Log delete action
    await logAction({
      userId,
      action: 'DELETE',
      entity: 'Book',
      entityId: id
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;