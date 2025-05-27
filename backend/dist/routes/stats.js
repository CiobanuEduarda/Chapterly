// @ts-nocheck
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statsRepository_1 = require("../repositories/statsRepository");
const router = express_1.default.Router();
// Get comprehensive book statistics
router.get('/books', async (req, res) => {
    try {
        const stats = await (0, statsRepository_1.getBookStatistics)();
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching book statistics:', error);
        res.status(500).json({ error: 'Failed to fetch book statistics' });
    }
});
// Get paginated books with their statistics
router.get('/books/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const books = await (0, statsRepository_1.getBooksWithStats)(page, pageSize);
        res.json(books);
    }
    catch (error) {
        console.error('Error fetching paginated books:', error);
        res.status(500).json({ error: 'Failed to fetch paginated books' });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map