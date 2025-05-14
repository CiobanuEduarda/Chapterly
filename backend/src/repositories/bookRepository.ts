import { PrismaClient, Book, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Get all books with pagination, filtering, and sorting
export async function getBooks(
  page: number = 1,
  limit: number = 10,
  filter?: string,
  sort?: string,
  userId?: number
): Promise<{ books: Book[]; total: number }> {
  try {
    const where: Prisma.BookWhereInput = {
      ...(filter ? {
        OR: [
          { title: { contains: filter, mode: 'insensitive' as const } },
          { author: { contains: filter, mode: 'insensitive' as const } },
          { genre: { contains: filter, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(userId ? { userId } : {})
    };

    const orderBy: Prisma.BookOrderByWithRelationInput = sort ? {
      [sort.split(':')[0]]: sort.split(':')[1] as Prisma.SortOrder
    } : { id: 'asc' };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where })
    ]);

    return { books, total };
  } catch (error) {
    console.error('Error getting books:', error);
    throw error;
  }
}

// Get a book by ID
export async function getBookById(id: number): Promise<Book | null> {
  try {
    return await prisma.book.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error(`Error getting book with ID ${id}:`, error);
    throw error;
  }
}

// Create a new book
export async function createBook(book: Omit<Book, 'id'>, userId: number): Promise<Book> {
  if (!userId || typeof userId !== 'number') {
    throw new Error('Valid userId is required to create a book');
  }

  return await prisma.book.create({
    data: {
      ...book,
      userId: userId
    } as Prisma.BookUncheckedCreateInput
  });
}

// Update a book
export async function updateBook(id: number, book: Omit<Book, 'id'>): Promise<Book | null> {
  try {
    return await prisma.book.update({
      where: { id },
      data: book
    });
  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    throw error;
  }
}

// Delete a book
export async function deleteBook(id: number): Promise<boolean> {
  try {
    await prisma.book.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    throw error;
  }
} 

// Delete all books (for seeding)
export async function deleteAllBooks(): Promise<void> {
  try {
    await prisma.book.deleteMany();
  } catch (error) {
    console.error('Error deleting all books:', error);
    throw error;
  }
} 