"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = getReviews;
exports.getReviewById = getReviewById;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.getBookReviews = getBookReviews;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getReviews(page = 1, limit = 10, filters, sort) {
    const where = {};
    // Apply filters
    if (filters) {
        if (filters.bookId)
            where.bookId = filters.bookId;
        if (filters.rating)
            where.rating = filters.rating;
        if (filters.minRating || filters.maxRating) {
            where.rating = {
                ...(filters.minRating && { gte: filters.minRating }),
                ...(filters.maxRating && { lte: filters.maxRating }),
            };
        }
    }
    // Apply sorting
    const orderBy = {};
    if (sort) {
        orderBy[sort.field] = sort.order;
    }
    else {
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
async function getReviewById(id) {
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
async function createReview(data) {
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
async function updateReview(id, data) {
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
async function deleteReview(id) {
    const result = await prisma.review.delete({
        where: { id },
    });
    return !!result;
}
async function getBookReviews(bookId, page = 1, limit = 10, sort) {
    return getReviews(page, limit, { bookId }, sort);
}
//# sourceMappingURL=reviewRepository.js.map