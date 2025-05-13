import { initializeDatabase } from '../db/init';
import * as bookRepository from '../repositories/bookRepository';

const sampleBooks = [
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
    price: 14.99,
    rating: 5
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Science Fiction',
    price: 11.99,
    rating: 5
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romance',
    price: 9.99,
    rating: 4
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    price: 15.99,
    rating: 5
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    genre: 'Fiction',
    price: 10.99,
    rating: 4
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    price: 19.99,
    rating: 5
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    price: 13.99,
    rating: 4
  },
  {
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fiction',
    price: 8.99,
    rating: 5
  },
  {
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    genre: 'Mystery',
    price: 16.99,
    rating: 4
  }
];

async function seed() {
  try {
    // Initialize the database
    await initializeDatabase();
    console.log('Database initialized');

    // Clear existing books
    await bookRepository.deleteAllBooks();
    console.log('Existing books cleared');

    // Insert sample books
    for (const book of sampleBooks) {
      await bookRepository.createBook(book);
    }
    console.log('Sample books inserted successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 