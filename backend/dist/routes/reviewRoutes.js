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
const reviewRepository = __importStar(require("../repositories/reviewRepository"));
const router = express_1.default.Router();
// Get all reviews with pagination, filtering, and sorting
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            bookId: req.query.bookId ? parseInt(req.query.bookId) : undefined,
            rating: req.query.rating ? parseInt(req.query.rating) : undefined,
            minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
            maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
        };
        const sort = req.query.sort ? {
            field: req.query.sort.split(':')[0],
            order: req.query.sort.split(':')[1],
        } : undefined;
        const result = await reviewRepository.getReviews(page, limit, filters, sort);
        res.json(result);
    }
    catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});
// Get a review by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const review = await reviewRepository.getReviewById(id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
    }
    catch (error) {
        console.error(`Error getting review with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to get review' });
    }
});
// Create a new review
router.post('/', async (req, res) => {
    try {
        const { content, rating, bookId } = req.body;
        if (!content || !rating || !bookId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const review = await reviewRepository.createReview({ content, rating, bookId });
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});
// Update a review
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { content, rating } = req.body;
        if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const review = await reviewRepository.updateReview(id, { content, rating });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
    }
    catch (error) {
        console.error(`Error updating review with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update review' });
    }
});
// Delete a review
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await reviewRepository.deleteReview(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting review with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});
// Get reviews for a specific book
router.get('/book/:bookId', async (req, res) => {
    try {
        const bookId = parseInt(req.params.bookId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort ? {
            field: req.query.sort.split(':')[0],
            order: req.query.sort.split(':')[1],
        } : undefined;
        const result = await reviewRepository.getBookReviews(bookId, page, limit, sort);
        res.json(result);
    }
    catch (error) {
        console.error(`Error getting reviews for book ${req.params.bookId}:`, error);
        res.status(500).json({ error: 'Failed to get book reviews' });
    }
});
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map