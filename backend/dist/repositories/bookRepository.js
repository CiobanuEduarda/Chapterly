// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBooks = getBooks;
exports.getBookById = getBookById;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
exports.deleteAllBooks = deleteAllBooks;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all books with pagination, filtering, and sorting
async function getBooks(page = 1, limit = 10, filter, 
    // @ts-ignore
    sort, 
    // @ts-ignore
    userId) {
    try {
        const where = {
            ...(filter ? {
                OR: [
                    { title: { contains: filter, mode: 'insensitive' } },
                    { author: { contains: filter, mode: 'insensitive' } },
                    { genre: { contains: filter, mode: 'insensitive' } }
                ]
            } : {}),
            ...(userId ? { userId } : {})
        };
        // Define valid sort fields
        const validSortFields = ['id', 'title', 'author', 'genre', 'price', 'rating', 'createdAt', 'updatedAt'];
        const orderBy = sort ? {
            [sort.split(':')[0]]: sort.split(':')[1]
        } : { id: 'asc' };
        const [books, total] = await Promise.all([
            prisma.book.findMany({
                // @ts-ignore
                where,
                // @ts-ignore
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            // @ts-ignore
            prisma.book.count({ where })
        ]);
        return { books, total };
    }
    catch (error) {
        console.error('Error getting books:', error);
        throw error;
    }
}
// Get a book by ID
// @ts-ignore
async function getBookById(id) {
    try {
        return await prisma.book.findUnique({
            where: { id }
        });
    }
    catch (error) {
        console.error(`Error getting book with ID ${id}:`, error);
        throw error;
    }
}
// Create a new book
// @ts-ignore
async function createBook(book, userId) {
    if (!userId || typeof userId !== 'number') {
        throw new Error('Valid userId is required to create a book');
    }
    return await prisma.book.create({
        data: {
            ...book,
            userId: userId
        }
    });
}
// Update a book
// @ts-ignore
async function updateBook(id, book) {
    try {
        return await prisma.book.update({
            where: { id },
            data: book
        });
    }
    catch (error) {
        console.error(`Error updating book with ID ${id}:`, error);
        throw error;
    }
}
// Delete a book
// @ts-ignore
async function deleteBook(id) {
    try {
        await prisma.book.delete({
            where: { id }
        });
        return true;
    }
    catch (error) {
        console.error(`Error deleting book with ID ${id}:`, error);
        throw error;
    }
}
// Delete all books (for seeding)
async function deleteAllBooks() {
    try {
        await prisma.book.deleteMany();
    }
    catch (error) {
        console.error('Error deleting all books:', error);
        throw error;
    }
}
//# sourceMappingURL=bookRepository.js.map