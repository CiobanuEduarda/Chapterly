import express, { Request, Response } from 'express';
import cors from 'cors';
import { body, validationResult, param, query } from 'express-validator';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Book } from './types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const port = 3001;

// In-memory storage
export let books: Book[] = [];

// Middleware
app.use(cors());
app.use(express.json());

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
  res.status(204).send();
});

// Start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;