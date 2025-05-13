import { PrismaClient, Category, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export interface CategoryFilters {
  name?: string;
  hasBooks?: boolean;
}

export interface CategorySort {
  field: 'name' | 'createdAt';
  order: 'asc' | 'desc';
}

export async function getCategories(
  page: number = 1,
  limit: number = 10,
  filters?: CategoryFilters,
  sort?: CategorySort
): Promise<{ categories: Category[]; total: number }> {
  const where: Prisma.CategoryWhereInput = {};

  // Apply filters
  if (filters) {
    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }
    if (filters.hasBooks) {
      where.books = {
        some: {},
      };
    }
  }

  // Apply sorting
  const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
  if (sort) {
    orderBy[sort.field] = sort.order;
  } else {
    orderBy.name = 'asc';
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return { categories, total };
}

export async function getCategoryById(id: number): Promise<Category | null> {
  return prisma.category.findUnique({
    where: { id },
    include: {
      books: {
        include: {
          book: {
            select: {
              title: true,
              author: true,
            },
          },
        },
      },
    },
  });
}

export async function createCategory(data: CreateCategoryData): Promise<Category> {
  return prisma.category.create({
    data,
    include: {
      _count: {
        select: {
          books: true,
        },
      },
    },
  });
}

export async function updateCategory(
  id: number,
  data: UpdateCategoryData
): Promise<Category | null> {
  return prisma.category.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          books: true,
        },
      },
    },
  });
}

export async function deleteCategory(id: number): Promise<boolean> {
  const result = await prisma.category.delete({
    where: { id },
  });
  return !!result;
}

export async function addBookToCategory(
  bookId: number,
  categoryId: number
): Promise<void> {
  await prisma.bookCategory.create({
    data: {
      bookId,
      categoryId,
    },
  });
}

export async function removeBookFromCategory(
  bookId: number,
  categoryId: number
): Promise<void> {
  await prisma.bookCategory.delete({
    where: {
      bookId_categoryId: {
        bookId,
        categoryId,
      },
    },
  });
}

export async function getBookCategories(
  bookId: number
): Promise<Category[]> {
  const bookCategories = await prisma.bookCategory.findMany({
    where: { bookId },
    include: {
      category: true,
    },
  });

  return bookCategories.map(bc => bc.category);
} 