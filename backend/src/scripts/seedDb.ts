import pool from '../config/database';
import { Book } from '../types';

// Sample books data
const sampleBooks: Omit<Book, 'id'>[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    price: 12.99,
    rating: 5
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    price: 10.99,
    rating: 5
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Science Fiction',
    price: 9.99,
    rating: 4
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romance',
    price: 8.99,
    rating: 5
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    price: 14.99,
    rating: 5
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    genre: 'Fiction',
    price: 11.99,
    rating: 4
  },
  {
    title: 'Lord of the Flies',
    author: 'William Golding',
    genre: 'Fiction',
    price: 9.99,
    rating: 4
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    price: 10.99,
    rating: 5
  },
  {
    title: 'Brave New World',
    author: 'Aldous Huxley',
    genre: 'Science Fiction',
    price: 11.99,
    rating: 4
  },
  {
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fiction',
    price: 7.99,
    rating: 5
  }
];

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
    console.log('Cleared existing data');
    
    // Insert sample books
    for (const book of sampleBooks) {
      await pool.query(
        'INSERT INTO books (title, author, genre, price, rating) VALUES ($1, $2, $3, $4, $5)',
        [book.title, book.author, book.genre, book.price, book.rating]
      );
    }
    
    console.log(`Inserted ${sampleBooks.length} sample books`);
    console.log('Database seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 
 