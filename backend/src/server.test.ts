import request from 'supertest';
import app, { books } from './server';
import { Book } from './types';

describe('Book API', () => {
  const testBook = {
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Fiction',
    price: 10.99,
    rating: 4
  };

  beforeEach(() => {
    // Reset the books array before each test
    books.length = 0;
  });

  describe('GET /api/books', () => {
    it('should return empty array when no books exist', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('should return all books', async () => {
      // Add a test book
      const book = { id: 1, ...testBook };
      books.push(book);

      const response = await request(app)
        .get('/api/books')
        .expect(200);
      
      expect(response.body).toEqual([book]);
    });

    it('should filter books by title', async () => {
      const testBooks = [
        { id: 1, ...testBook },
        { id: 2, title: 'Another Book', author: 'Another Author', genre: 'Non-Fiction', price: 15.99, rating: 5 }
      ];
      books.push(...testBooks);

      const response = await request(app)
        .get('/api/books')
        .query({ filter: 'title:Test' })
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Book');
    });

  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const response = await request(app)
        .post('/api/books')
        .send(testBook)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...testBook
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ title: 'Test Book' })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });

    it('should validate price is positive', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ ...testBook, price: -10 })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });

    it('should validate rating is between 1 and 5', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ ...testBook, rating: 6 })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update an existing book', async () => {
      const book = { id: 1, ...testBook };
      books.push(book);

      const updatedBook = { ...testBook, title: 'Updated Title' };
      const response = await request(app)
        .put('/api/books/1')
        .send(updatedBook)
        .expect(200);
      
      expect(response.body.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put('/api/books/999')
        .send(testBook)
        .expect(404);
      
      expect(response.body.message).toBe('Book not found');
    });

    it('should validate update data', async () => {
      const book = { id: 1, ...testBook };
      books.push(book);

      const response = await request(app)
        .put('/api/books/1')
        .send({ ...testBook, price: -10 })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete an existing book', async () => {
      const book = { id: 1, ...testBook };
      books.push(book);

      await request(app)
        .delete('/api/books/1')
        .expect(204);
      
      expect(books).toHaveLength(0);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/api/books/999')
        .expect(404);
      
      expect(response.body.message).toBe('Book not found');
    });
  });
}); 