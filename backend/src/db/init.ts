import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SQL to drop the books table
const dropBooksTable = `DROP TABLE IF EXISTS books CASCADE;`;

// SQL to create the books table
const createBooksTable = `
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// SQL to create a trigger to update the updated_at timestamp
const createUpdateTimestampTrigger = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

// Initialize the database
export async function initializeDatabase() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Successfully connected to database');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
} 
 