import pool from '../config/database';
import { Book } from '../types';

// Get all books with pagination, filtering, and sorting
export async function getBooks(
  page: number = 1,
  limit: number = 10,
  filter?: string,
  sort?: string
): Promise<{ books: Book[]; total: number }> {
  try {
    let query = 'SELECT * FROM books';
    const queryParams: any[] = [];
    let countQuery = 'SELECT COUNT(*) FROM books';
    let whereClause = '';
    let orderClause = '';

    // Apply filtering
    if (filter) {
      const [field, value] = filter.split(':');
      whereClause = ` WHERE ${field} ILIKE $1`;
      queryParams.push(`%${value}%`);
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      orderClause = ` ORDER BY ${field} ${direction.toUpperCase()}`;
    } else {
      orderClause = ' ORDER BY id ASC';
    }

    // Add pagination
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);
    query += whereClause + orderClause + ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    countQuery += whereClause;

    // Execute queries
    const [booksResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    return {
      books: booksResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting books:', error);
    throw error;
  }
}

// Get a book by ID
export async function getBookById(id: number): Promise<Book | null> {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error getting book with ID ${id}:`, error);
    throw error;
  }
}

// Create a new book
export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
  try {
    const { title, author, genre, price, rating } = book;
    const result = await pool.query(
      'INSERT INTO books (title, author, genre, price, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, author, genre, price, rating]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
}

// Update a book
export async function updateBook(id: number, book: Omit<Book, 'id'>): Promise<Book | null> {
  try {
    const { title, author, genre, price, rating } = book;
    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, genre = $3, price = $4, rating = $5 WHERE id = $6 RETURNING *',
      [title, author, genre, price, rating, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    throw error;
  }
}

// Delete a book
export async function deleteBook(id: number): Promise<boolean> {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    throw error;
  }
} 
import { Book } from '../types';

// Get all books with pagination, filtering, and sorting
export async function getBooks(
  page: number = 1,
  limit: number = 10,
  filter?: string,
  sort?: string
): Promise<{ books: Book[]; total: number }> {
  try {
    let query = 'SELECT * FROM books';
    const queryParams: any[] = [];
    let countQuery = 'SELECT COUNT(*) FROM books';
    let whereClause = '';
    let orderClause = '';

    // Apply filtering
    if (filter) {
      const [field, value] = filter.split(':');
      whereClause = ` WHERE ${field} ILIKE $1`;
      queryParams.push(`%${value}%`);
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      orderClause = ` ORDER BY ${field} ${direction.toUpperCase()}`;
    } else {
      orderClause = ' ORDER BY id ASC';
    }

    // Add pagination
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);
    query += whereClause + orderClause + ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    countQuery += whereClause;

    // Execute queries
    const [booksResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    return {
      books: booksResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting books:', error);
    throw error;
  }
}

// Get a book by ID
export async function getBookById(id: number): Promise<Book | null> {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error getting book with ID ${id}:`, error);
    throw error;
  }
}

// Create a new book
export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
  try {
    const { title, author, genre, price, rating } = book;
    const result = await pool.query(
      'INSERT INTO books (title, author, genre, price, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, author, genre, price, rating]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
}

// Update a book
export async function updateBook(id: number, book: Omit<Book, 'id'>): Promise<Book | null> {
  try {
    const { title, author, genre, price, rating } = book;
    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, genre = $3, price = $4, rating = $5 WHERE id = $6 RETURNING *',
      [title, author, genre, price, rating, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    throw error;
  }
}

// Delete a book
export async function deleteBook(id: number): Promise<boolean> {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    throw error;
  }
} 