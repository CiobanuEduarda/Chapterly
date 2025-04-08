"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.books = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_validator_1 = require("express-validator");
const ws_1 = require("ws");
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const stream_1 = require("stream");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const port = 3001;
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(uploadsDir));
// In-memory storage
exports.books = [];
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(uploadsDir));
// Validation middleware
const validateBook = [
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required').isString().withMessage('Title must be a string'),
    (0, express_validator_1.body)('author').trim().notEmpty().withMessage('Author is required').isString().withMessage('Author must be a string'),
    (0, express_validator_1.body)('genre').trim().notEmpty().withMessage('Genre is required').isString().withMessage('Genre must be a string'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];
// Validate ID parameter
const validateId = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];
// Validate pagination parameters
const validatePagination = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    // Send initial books data
    ws.send(JSON.stringify({ type: 'books', data: exports.books }));
    ws.on('close', () => {
        console.log('Client disconnected');
    });
    // Send a ping message every 5 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
        else {
            clearInterval(pingInterval);
        }
    }, 5000);
    ws.on('close', () => {
        clearInterval(pingInterval);
    });
});
// Broadcast function to send updates to all connected clients
const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
};
// Background thread for generating new books
const generateNewBook = () => {
    const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Romance'];
    const newBook = {
        id: exports.books.length + 1,
        title: `Generated Book ${exports.books.length + 1}`,
        author: `Author ${Math.floor(Math.random() * 100)}`,
        genre: genres[Math.floor(Math.random() * genres.length)],
        price: Math.floor(Math.random() * 100) + 10,
        rating: Math.floor(Math.random() * 5) + 1
    };
    exports.books.push(newBook);
    broadcast({ type: 'books', data: exports.books });
};
// Generate a new book every 30 seconds
setInterval(generateNewBook, 30000);
// Routes
app.get('/api/books', validatePagination, (req, res) => {
    const { sort, filter, page = '1', limit = '20' } = req.query;
    let filteredBooks = [...exports.books];
    // Apply filtering
    if (filter && typeof filter === 'string') {
        const [field, value] = filter.split(':');
        if (field && value) {
            filteredBooks = filteredBooks.filter(book => String(book[field]).toLowerCase().includes(value.toLowerCase()));
        }
    }
    // Apply sorting
    if (sort && typeof sort === 'string') {
        const [field, order] = sort.split(':');
        if (field && order) {
            filteredBooks.sort((a, b) => {
                const aValue = String(a[field]);
                const bValue = String(b[field]);
                return order === 'desc' ?
                    (bValue > aValue ? 1 : -1) :
                    (aValue > bValue ? 1 : -1);
            });
        }
    }
    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
    // Return paginated results with metadata
    res.json({
        books: paginatedBooks,
        pagination: {
            total: filteredBooks.length,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(filteredBooks.length / limitNum),
            hasMore: endIndex < filteredBooks.length
        }
    });
});
app.post('/api/books', validateBook, (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const newBook = Object.assign({ id: exports.books.length + 1 }, req.body);
    exports.books.push(newBook);
    // Broadcast the update to all connected clients
    broadcast({ type: 'books', data: exports.books });
    res.status(201).json(newBook);
});
app.put('/api/books/:id', validateId, validateBook, (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const id = parseInt(req.params.id || '0');
    const index = exports.books.findIndex(book => book.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }
    exports.books[index] = Object.assign(Object.assign({}, exports.books[index]), req.body);
    // Broadcast the update to all connected clients
    broadcast({ type: 'books', data: exports.books });
    res.json(exports.books[index]);
});
app.delete('/api/books/:id', validateId, (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const id = parseInt(req.params.id || '0');
    const index = exports.books.findIndex(book => book.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }
    exports.books = exports.books.filter(book => book.id !== id);
    // Broadcast the update to all connected clients
    broadcast({ type: 'books', data: exports.books });
    res.status(204).send();
});
// File upload endpoint
app.post('/api/upload', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.includes('multipart/form-data'))) {
            return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'file-' + uniqueSuffix + '.tmp';
        const filePath = path_1.default.join(uploadsDir, filename);
        const writeStream = fs_1.default.createWriteStream(filePath);
        const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
        yield streamPipeline(req, writeStream);
        const stats = yield (0, util_1.promisify)(fs_1.default.stat)(filePath);
        const fileInfo = {
            filename,
            originalName: req.headers['x-file-name'] || filename,
            size: stats.size,
            mimetype: req.headers['content-type'],
            path: `/uploads/${filename}`
        };
        res.json(fileInfo);
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
}));
// File download endpoint
app.get('/api/download/:filename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }
        const filePath = path_1.default.join(uploadsDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        const stat = yield (0, util_1.promisify)(fs_1.default.stat)(filePath);
        const fileStream = fs_1.default.createReadStream(filePath);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'File download failed' });
    }
}));
// Delete file endpoint
app.delete('/api/files/:filename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filename = req.params.filename;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }
        const filePath = path_1.default.join(uploadsDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        yield (0, util_1.promisify)(fs_1.default.unlink)(filePath);
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
}));
// List files endpoint
app.get('/api/files', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield (0, util_1.promisify)(fs_1.default.readdir)(uploadsDir);
        const fileDetails = yield Promise.all(files.map((filename) => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = path_1.default.join(uploadsDir, filename);
            const stats = yield (0, util_1.promisify)(fs_1.default.stat)(filePath);
            return {
                filename,
                size: stats.size,
                uploadDate: stats.mtime
            };
        })));
        res.json(fileDetails);
    }
    catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
}));
// Start the server
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
