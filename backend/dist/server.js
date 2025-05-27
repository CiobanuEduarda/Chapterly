"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const init_1 = require("./db/init");
const bookRoutes_1 = __importDefault(require("./routes/bookRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const stats_1 = __importDefault(require("./routes/stats"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// Create Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(uploadsDir));
// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// Validation middleware
const validateBookAttributes = (req, res, next) => {
    const { title, author, genre, price, rating } = req.body;
    if (!title || !author || !genre || !price || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof title !== 'string' || typeof author !== 'string' || typeof genre !== 'string') {
        return res.status(400).json({ error: 'Invalid field types' });
    }
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    next();
};
const validateIdParam = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID parameter' });
    }
    next();
};
const validatePaginationParams = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1 || limit < 1) {
        return res.status(400).json({ error: 'Invalid pagination parameters' });
    }
    next();
};
// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
    });
});
// File download endpoint
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path_1.default.join(uploadsDir, filename);
    if (!fs_1.default.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.download(filepath);
});
// Delete file endpoint
app.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path_1.default.join(uploadsDir, filename);
    if (!fs_1.default.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    fs_1.default.unlink(filepath, (error) => {
        if (error) {
            console.error('Error deleting file:', error);
            return res.status(500).json({ error: 'Failed to delete file' });
        }
        res.status(204).send();
    });
});
// List files endpoint
app.get('/api/files', (req, res) => {
    fs_1.default.readdir(uploadsDir, (error, files) => {
        if (error) {
            console.error('Error reading directory:', error);
            return res.status(500).json({ error: 'Failed to list files' });
        }
        const fileDetails = files.map(filename => {
            const filepath = path_1.default.join(uploadsDir, filename);
            const stats = fs_1.default.statSync(filepath);
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        });
        res.json(fileDetails);
    });
});
// Register routes
app.use('/api/books', bookRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Initialize database and start server
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        // Initialize the database
        const dbInitialized = await (0, init_1.initializeDatabase)();
        if (!dbInitialized) {
            console.error('Failed to initialize database. Exiting...');
            process.exit(1);
        }
        // Start the server
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}
// Only start the server if this file is run directly
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map