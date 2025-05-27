// @ts-nocheck
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const bookRepository = __importStar(require("../repositories/bookRepository"));
const logAction_1 = require("../utils/logAction");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all books with pagination and filtering
router.get('/', auth_1.authenticateToken, roleAuth_1.requireUser, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filter = req.query.filter;
        const genre = req.query.genre;
        const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
        const sort = req.query.sort;
        const skip = (page - 1) * limit;
        // Build where clause based on filter and role
        const where = {
            ...(filter ? {
                OR: [
                    { title: { contains: filter, mode: client_1.Prisma.QueryMode.insensitive } },
                    { author: { contains: filter, mode: client_1.Prisma.QueryMode.insensitive } },
                    { genre: { contains: filter, mode: client_1.Prisma.QueryMode.insensitive } }
                ]
            } : {}),
            ...(genre ? { genre } : {}),
            ...(rating ? { rating: { gte: rating } } : {}),
            // Only show user's books unless admin
            ...(userRole !== 'ADMIN' ? { userId } : {})
        };
        // Build orderBy clause based on sort
        const orderBy = sort ? {
            [sort.split(':')[0]]: sort.split(':')[1]
        } : { id: 'asc' };
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
        // Log read action (list)
        await (0, logAction_1.logAction)({
            userId,
            action: 'READ',
            entity: 'Book',
        });
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
    }
    catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});
// Get a single book by ID
router.get('/:id', auth_1.authenticateToken, roleAuth_1.requireUser, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const id = parseInt(req.params.id);
        const book = await prisma.book.findFirst({
            where: {
                id,
                ...(userRole !== 'ADMIN' ? { userId } : {})
            },
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
        // Log read action (single)
        await (0, logAction_1.logAction)({
            userId,
            action: 'READ',
            entity: 'Book',
            entityId: id
        });
        res.json(book);
    }
    catch (error) {
        console.error(`Error fetching book with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});
// Create a new book
router.post('/', auth_1.authenticateToken, roleAuth_1.requireUser, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId || typeof userId !== 'number') {
            return res.status(401).json({ error: 'Unauthorized: userId missing or invalid' });
        }
        const { title, author, genre, price, rating } = req.body;
        if (!title || !author || !genre || typeof price !== 'number' || typeof rating !== 'number') {
            return res.status(400).json({ error: 'Missing or invalid book fields' });
        }
        const bookData = {
            title: req.body.title,
            author: req.body.author,
            genre: req.body.genre,
            price: req.body.price,
            rating: req.body.rating,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId
        };
        const book = await bookRepository.createBook(bookData, userId);
        // Log create action
        await (0, logAction_1.logAction)({
            userId,
            action: 'CREATE',
            entity: 'Book',
            entityId: book.id
        });
        res.status(201).json(book);
    }
    catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});
// Update a book
router.put('/:id', auth_1.authenticateToken, roleAuth_1.requireUser, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const id = parseInt(req.params.id);
        const { title, author, genre, price, rating, categoryIds } = req.body;
        // Debug logging
        console.log('UPDATE attempt:', { userId, userRole, bookId: id });
        // Check ownership or admin status
        const bookToUpdate = await prisma.book.findFirst({
            where: {
                id,
                ...(userRole !== 'ADMIN' ? { userId } : {})
            }
        });
        console.log('Book found for update:', bookToUpdate);
        if (!bookToUpdate) {
            return res.status(404).json({ error: 'Book not found or not owned by user' });
        }
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
                    create: categoryIds.map((categoryId) => ({
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
        // Log update action
        await (0, logAction_1.logAction)({
            userId,
            action: 'UPDATE',
            entity: 'Book',
            entityId: id
        });
        res.json(book);
    }
    catch (error) {
        console.error(`Error updating book with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});
// Delete a book
router.delete('/:id', auth_1.authenticateToken, roleAuth_1.requireUser, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const id = parseInt(req.params.id);
        // Debug logging
        console.log('DELETE attempt:', { userId, userRole, bookId: id });
        // Check ownership or admin status
        const bookToDelete = await prisma.book.findFirst({
            where: {
                id,
                ...(userRole !== 'ADMIN' ? { userId } : {})
            }
        });
        console.log('Book found for delete:', bookToDelete);
        if (!bookToDelete) {
            return res.status(404).json({ error: 'Book not found or not owned by user' });
        }
        await prisma.book.delete({
            where: { id }
        });
        // Log delete action
        await (0, logAction_1.logAction)({
            userId,
            action: 'DELETE',
            entity: 'Book',
            entityId: id
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});
exports.default = router;
//# sourceMappingURL=bookRoutes.js.map