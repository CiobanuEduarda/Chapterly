import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initializeDatabase } from './db/init';
import * as bookRepository from './repositories/bookRepository';
import { Book } from './types';

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// WebSocket connection
io.on('connection', (socket: Socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Validation middleware
const validateBookAttributes = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

const validateIdParam = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  
  next();
};

const validatePaginationParams = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1 || limit < 1) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }
  
  next();
};

// Routes
app.get('/api/books', validatePaginationParams, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string;
    const sort = req.query.sort as string;
    
    const { books, total } = await bookRepository.getBooks(page, limit, filter, sort);
    
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
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/:id', validateIdParam, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const book = await bookRepository.getBookById(id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error(`Error fetching book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

app.post('/api/books', validateBookAttributes, async (req, res) => {
  try {
    const newBook = await bookRepository.createBook(req.body);
    
    // Notify all clients about the new book
    io.emit('books', { type: 'add', book: newBook });
    
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.put('/api/books/:id', validateIdParam, validateBookAttributes, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedBook = await bookRepository.updateBook(id, req.body);
    
    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Notify all clients about the updated book
    io.emit('books', { type: 'update', book: updatedBook });
    
    res.json(updatedBook);
  } catch (error) {
    console.error(`Error updating book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', validateIdParam, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await bookRepository.deleteBook(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Notify all clients about the deleted book
    io.emit('books', { type: 'delete', id });
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting book with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

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
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filepath);
});

// Delete file endpoint
app.delete('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  fs.unlink(filepath, (error) => {
    if (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    
    res.status(204).send();
  });
});

// List files endpoint
app.get('/api/files', (req, res) => {
  fs.readdir(uploadsDir, (error, files) => {
    if (error) {
      console.error('Error reading directory:', error);
      return res.status(500).json({ error: 'Failed to list files' });
    }
    
    const fileDetails = files.map(filename => {
      const filepath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filepath);
      
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

// Initialize database and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize the database
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;