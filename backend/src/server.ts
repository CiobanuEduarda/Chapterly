import express, { Request, Response } from 'express';
import cors from 'cors';
import { body, validationResult, param } from 'express-validator';
import { Book } from './types';

const app = express();
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

// Routes
app.get('/api/books', (req: Request, res: Response) => {
  const { sort, filter } = req.query;
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

  res.json(filteredBooks);
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

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app; 