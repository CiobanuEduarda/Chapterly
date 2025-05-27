// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBooksWithStats = exports.getBookStatistics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// In-memory cache
let cachedStats = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute
const getBookStatistics = async () => {
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
        }, {});
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
exports.getBookStatistics = getBookStatistics;
// Get books with their categories and review statistics
const getBooksWithStats = async (page = 1, pageSize = 20) => {
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
exports.getBooksWithStats = getBooksWithStats;
//# sourceMappingURL=statsRepository.js.map