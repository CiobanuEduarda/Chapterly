import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all books with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string;
    const sort = req.query.sort as string;

    const skip = (page - 1) * limit;

    // Build where clause based on filter
    const where: Prisma.BookWhereInput = filter ? {
      OR: [
        { title: { contains: filter, mode: Prisma.QueryMode.insensitive } },
        { author: { contains: filter, mode: Prisma.QueryMode.insensitive } },
        { genre: { contains: filter, mode: Prisma.QueryMode.insensitive } }
      ]
    } : {};

    // Build orderBy clause based on sort
    const orderBy: Prisma.BookOrderByWithRelationInput = sort ? {
      [sort]: Prisma.SortOrder.desc
    } : {
      rating: Prisma.SortOrder.desc
    };

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
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const book = await prisma.book.findUnique({
      where: { id },
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

    res.json(book);
  } catch (error) {
    console.error(`Error fetching book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, genre, price, rating, categoryIds } = req.body;

    const book = await prisma.book.create({
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

    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update a book
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, author, genre, price, rating, categoryIds } = req.body;

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

    res.json(book);
  } catch (error) {
    console.error(`Error updating book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.book.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router; 