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
const categoryRepository = __importStar(require("../repositories/categoryRepository"));
const router = express_1.default.Router();
// Get all categories with pagination, filtering, and sorting
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            name: req.query.name,
            hasBooks: req.query.hasBooks === 'true',
        };
        const sort = req.query.sort ? {
            field: req.query.sort.split(':')[0],
            order: req.query.sort.split(':')[1],
        } : undefined;
        const result = await categoryRepository.getCategories(page, limit, filters, sort);
        res.json(result);
    }
    catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});
// Get a category by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await categoryRepository.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    }
    catch (error) {
        console.error(`Error getting category with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to get category' });
    }
});
// Create a new category
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const category = await categoryRepository.createCategory({ name, description });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
// Update a category
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, description } = req.body;
        const category = await categoryRepository.updateCategory(id, { name, description });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    }
    catch (error) {
        console.error(`Error updating category with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});
// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await categoryRepository.deleteCategory(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting category with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
// Add a book to a category
router.post('/:categoryId/books/:bookId', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const bookId = parseInt(req.params.bookId);
        await categoryRepository.addBookToCategory(bookId, categoryId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error adding book to category:', error);
        res.status(500).json({ error: 'Failed to add book to category' });
    }
});
// Remove a book from a category
router.delete('/:categoryId/books/:bookId', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const bookId = parseInt(req.params.bookId);
        await categoryRepository.removeBookFromCategory(bookId, categoryId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error removing book from category:', error);
        res.status(500).json({ error: 'Failed to remove book from category' });
    }
});
// Get categories for a specific book
router.get('/book/:bookId', async (req, res) => {
    try {
        const bookId = parseInt(req.params.bookId);
        const categories = await categoryRepository.getBookCategories(bookId);
        res.json(categories);
    }
    catch (error) {
        console.error(`Error getting categories for book ${req.params.bookId}:`, error);
        res.status(500).json({ error: 'Failed to get book categories' });
    }
});
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map