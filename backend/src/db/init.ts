import pool from '../config/database';

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
    // Create the books table
    await pool.query(createBooksTable);
    console.log('Books table created or already exists');

    // Create the update timestamp trigger
    await pool.query(createUpdateTimestampTrigger);
    console.log('Update timestamp trigger created or already exists');

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
} 
 