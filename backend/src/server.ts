import express, { Request, Response } from 'express';
import cors from 'cors';
import { body, validationResult, param, query } from 'express-validator';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Book } from './types';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const port = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// In-memory storage
export let books: Book[] = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Validation middleware
const validateBook = [
  body('title').trim().notEmpty().withMessage('Title is required').isString().withMessage('Title must be a string'),
  body('author').trim().notEmpty().withMessage('Author is required').isString().withMessage('Author must be a string'),
  body('genre').trim().notEmpty().withMessage('Genre is required').isString().withMessage('Genre must be a string'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// Validate ID parameter
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

// Validate pagination parameters
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send initial books data
  ws.send(JSON.stringify({ type: 'books', data: books }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast function to send updates to all connected clients
const broadcast = (data: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Background thread for generating new books
const generateNewBook = () => {
  const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Romance'];
  const newBook: Book = {
    id: books.length + 1,
    title: `Generated Book ${books.length + 1}`,
    author: `Author ${Math.floor(Math.random() * 100)}`,
    genre: genres[Math.floor(Math.random() * genres.length)],
    price: Math.floor(Math.random() * 100) + 10,
    rating: Math.floor(Math.random() * 5) + 1
  };
  
  books.push(newBook);
  broadcast({ type: 'books', data: books });
};

// Generate a new book every 30 seconds
setInterval(generateNewBook, 30000);

// Routes
app.get('/api/books', validatePagination, (req: Request, res: Response) => {
  const { sort, filter, page = '1', limit = '20' } = req.query;
  let filteredBooks = [...books];

  // Apply filtering
  if (filter && typeof filter === 'string') {
    const [field, value] = filter.split(':');
    if (field && value) {
      filteredBooks = filteredBooks.filter(book => 
        String(book[field as keyof Book]).toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  // Apply sorting
  if (sort && typeof sort === 'string') {
    const [field, order] = sort.split(':');
    if (field && order) {
      filteredBooks.sort((a, b) => {
        const aValue = String(a[field as keyof Book]);
        const bValue = String(b[field as keyof Book]);
        return order === 'desc' ? 
          (bValue > aValue ? 1 : -1) : 
          (aValue > bValue ? 1 : -1);
      });
    }
  }

  // Apply pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
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

app.post('/api/books', validateBook, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const newBook = {
    id: books.length + 1,
    ...req.body
  };
  books.push(newBook);
  
  // Broadcast the update to all connected clients
  broadcast({ type: 'books', data: books });
  
  res.status(201).json(newBook);
});

app.put('/api/books/:id', validateId, validateBook, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = parseInt(req.params.id || '0');
  const index = books.findIndex(book => book.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  books[index] = { ...books[index], ...req.body };
  
  // Broadcast the update to all connected clients
  broadcast({ type: 'books', data: books });
  
  res.json(books[index]);
});

app.delete('/api/books/:id', validateId, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = parseInt(req.params.id || '0');
  const index = books.findIndex(book => book.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  books = books.filter(book => book.id !== id);
  
  // Broadcast the update to all connected clients
  broadcast({ type: 'books', data: books });
  
  res.status(204).send();
});

// File upload endpoint
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'file-' + uniqueSuffix + '.tmp';
    const filePath = path.join(uploadsDir, filename);

    const writeStream = fs.createWriteStream(filePath);
    const streamPipeline = promisify(pipeline);

    await streamPipeline(req, writeStream);

    const stats = await promisify(fs.stat)(filePath);
    const fileInfo = {
      filename,
      originalName: req.headers['x-file-name'] || filename,
      size: stats.size,
      mimetype: req.headers['content-type'],
      path: `/uploads/${filename}`
    };

    res.json(fileInfo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// File download endpoint
app.get('/api/download/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = await promisify(fs.stat)(filePath);
    const fileStream = fs.createReadStream(filePath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Delete file endpoint
app.delete('/api/files/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await promisify(fs.unlink)(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// List files endpoint
app.get('/api/files', async (req: Request, res: Response) => {
  try {
    const files = await promisify(fs.readdir)(uploadsDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        const stats = await promisify(fs.stat)(filePath);
        return {
          filename,
          size: stats.size,
          uploadDate: stats.mtime
        };
      })
    );
    res.json(fileDetails);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;