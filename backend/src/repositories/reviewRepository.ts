import { PrismaClient, Review, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateReviewData {
  content: string;
  rating: number;
  bookId: number;
}

export interface UpdateReviewData {
  content?: string;
  rating?: number;
}

export interface ReviewFilters {
  bookId?: number;
  rating?: number;
  minRating?: number;
  maxRating?: number;
}

export interface ReviewSort {
  field: 'rating' | 'createdAt';
  order: 'asc' | 'desc';
}

export async function getReviews(
  page: number = 1,
  limit: number = 10,
  filters?: ReviewFilters,
  sort?: ReviewSort
): Promise<{ reviews: Review[]; total: number }> {
  const where: Prisma.ReviewWhereInput = {};

  // Apply filters
  if (filters) {
    if (filters.bookId) where.bookId = filters.bookId;
    if (filters.rating) where.rating = filters.rating;
    if (filters.minRating || filters.maxRating) {
      where.rating = {
        ...(filters.minRating && { gte: filters.minRating }),
        ...(filters.maxRating && { lte: filters.maxRating }),
      };
    }
  }

  // Apply sorting
  const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
  if (sort) {
    orderBy[sort.field] = sort.order;
  } else {
    orderBy.createdAt = 'desc';
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        book: {
          select: {
            title: true,
            author: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return { reviews, total };
}

export async function getReviewById(id: number): Promise<Review | null> {
  return prisma.review.findUnique({
    where: { id },
    include: {
      book: {
        select: {
          title: true,
          author: true,
        },
      },
    },
  });
}

export async function createReview(data: CreateReviewData): Promise<Review> {
  return prisma.review.create({
    data,
    include: {
      book: {
        select: {
          title: true,
          author: true,
        },
      },
    },
  });
}

export async function updateReview(
  id: number,
  data: UpdateReviewData
): Promise<Review | null> {
  return prisma.review.update({
    where: { id },
    data,
    include: {
      book: {
        select: {
          title: true,
          author: true,
        },
      },
    },
  });
}

export async function deleteReview(id: number): Promise<boolean> {
  const result = await prisma.review.delete({
    where: { id },
  });
  return !!result;
}

export async function getBookReviews(
  bookId: number,
  page: number = 1,
  limit: number = 10,
  sort?: ReviewSort
): Promise<{ reviews: Review[]; total: number }> {
  return getReviews(page, limit, { bookId }, sort);
} 