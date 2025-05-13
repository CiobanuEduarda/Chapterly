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

export const getBookStatistics = async (): Promise<BookStats> => {
  // Use a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Get basic statistics
    const [totalBooks, totalReviews, averagePrice, averageRating] = await Promise.all([
      tx.book.count(),
      tx.review.count(),
      tx.book.aggregate({
        _avg: {
          price: true,
        },
      }),
      tx.book.aggregate({
        _avg: {
          rating: true,
        },
      }),
    ]);

    // Get category distribution with average ratings
    const categoryDistribution = await tx.category.findMany({
      select: {
        name: true,
        books: {
          select: {
            book: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });

    // Calculate price range distribution
    const priceRanges = await tx.book.groupBy({
      by: ['price'],
      _count: true,
      orderBy: {
        price: 'asc',
      },
    });

    // Get top rated books with review counts
    const topRatedBooks = await tx.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        rating: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
      take: 10,
    });

    // Process category distribution
    const processedCategoryDistribution = categoryDistribution.map(cat => ({
      categoryName: cat.name,
      bookCount: cat.books.length,
      averageRating: cat.books.reduce((acc, book) => acc + (book.book.rating || 0), 0) / cat.books.length || 0,
    }));

    // Process price ranges
    const priceRangeDistribution = priceRanges.reduce((acc, curr) => {
      const range = Math.floor(curr.price / 10) * 10;
      const rangeKey = `$${range}-${range + 9}`;
      acc[rangeKey] = (acc[rangeKey] || 0) + curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBooks,
      totalReviews,
      averagePrice: averagePrice._avg.price || 0,
      averageRating: averageRating._avg.rating || 0,
      categoryDistribution: processedCategoryDistribution,
      priceRangeDistribution: Object.entries(priceRangeDistribution).map(([range, count]) => ({
        range,
        count,
      })),
      topRatedBooks: topRatedBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        rating: book.rating,
        reviewCount: book._count.reviews,
      })),
    };
  });
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