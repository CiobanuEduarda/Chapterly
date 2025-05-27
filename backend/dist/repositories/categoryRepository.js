"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.addBookToCategory = addBookToCategory;
exports.removeBookFromCategory = removeBookFromCategory;
exports.getBookCategories = getBookCategories;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getCategories(page = 1, limit = 10, filters, sort) {
    const where = {};
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
    const orderBy = {};
    if (sort) {
        orderBy[sort.field] = sort.order;
    }
    else {
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
async function getCategoryById(id) {
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
async function createCategory(data) {
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
async function updateCategory(id, data) {
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
async function deleteCategory(id) {
    const result = await prisma.category.delete({
        where: { id },
    });
    return !!result;
}
async function addBookToCategory(bookId, categoryId) {
    await prisma.bookCategory.create({
        data: {
            bookId,
            categoryId,
        },
    });
}
async function removeBookFromCategory(bookId, categoryId) {
    await prisma.bookCategory.delete({
        where: {
            bookId_categoryId: {
                bookId,
                categoryId,
            },
        },
    });
}
async function getBookCategories(bookId) {
    const bookCategories = await prisma.bookCategory.findMany({
        where: { bookId },
        include: {
            category: true,
        },
    });
    return bookCategories.map(bc => bc.category);
}
//# sourceMappingURL=categoryRepository.js.map