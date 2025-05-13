import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface BookStats {
  totalBooks: number;
  averagePrice: number;
  averageRating: number;
  totalReviews: number;
  categoryDistribution: {
    categoryName: string;
    bookCount: number;
    averageRating: number;
  }[];
  priceRangeDistribution: {
    range: string;
    count: number;
  }[];
  topRatedBooks: {
    id: number;
    title: string;
    author: string;
    rating: number;
    reviewCount: number;
  }[];
}

// In-memory cache
let cachedStats: BookStats | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export const getBookStatistics = async (): Promise<BookStats> => {
  const now = Date.now();
  if (cachedStats && now - lastCacheTime < CACHE_DURATION) {
    return cachedStats;
  }

  // Use a transaction to ensure data consistency
  const stats = await prisma.$transaction(async (tx) => {
    // Get basic statistics
    const [totalBooks, totalReviews, averagePrice, averageRating] = await Promise.all([
      tx.book.count(),
      tx.review.count(),
      tx.book.aggregate({ _avg: { price: true } }),
      tx.book.aggregate({ _avg: { rating: true } }),
    ]);

    // Optimized: Get category distribution with average ratings using groupBy
    const categoryAgg = await tx.bookCategory.groupBy({
      by: ['categoryId'],
      _count: { bookId: true },
    });
    const categoryIds = categoryAgg.map(c => c.categoryId);
    const categories = await tx.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    // Get average rating per category (fixed)
    const avgRatings = await Promise.all(categoryIds.map(async (categoryId) => {
      const avg = await tx.book.aggregate({
        where: {
          categories: {
            some: { categoryId }
          }
        },
        _avg: { rating: true }
      });
      return avg._avg.rating ?? 0;
    }));
    const processedCategoryDistribution = categories.map((cat, idx) => ({
      categoryName: cat.name,
      bookCount: categoryAgg[idx]._count.bookId,
      averageRating: avgRatings[idx],
    }));

    // Optimized: Price range distribution using groupBy and bucketing in JS
    const priceAgg = await tx.book.groupBy({
      by: ['price'],
      _count: true,
      orderBy: { price: 'asc' },
    });
    const priceRangeDistribution = priceAgg.reduce((acc, curr) => {
      const range = Math.floor(Number(curr.price) / 10) * 10;
      const rangeKey = `$${range}-${range + 9}`;
      acc[rangeKey] = (acc[rangeKey] || 0) + curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Top rated books (already optimized)
    const topRatedBooks = await tx.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        rating: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { rating: 'desc' },
      take: 10,
    });

    return {
      totalBooks,
      totalReviews,
      averagePrice: averagePrice._avg.price || 0,
      averageRating: averageRating._avg.rating || 0,
      categoryDistribution: processedCategoryDistribution,
      priceRangeDistribution: Object.entries(priceRangeDistribution).map(([range, count]) => ({ range, count })),
      topRatedBooks: topRatedBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        rating: book.rating,
        reviewCount: book._count.reviews,
      })),
    };
  });

  cachedStats = stats;
  lastCacheTime = Date.now();
  return stats;
};

// Get books with their categories and review statistics
export const getBooksWithStats = async (page: number = 1, pageSize: number = 20) => {
  const skip = (page - 1) * pageSize;

  return await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      price: true,
      rating: true,
      categories: {
        select: {
          category: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    skip,
    take: pageSize,
    orderBy: {
      rating: 'desc',
    },
  });
}; 