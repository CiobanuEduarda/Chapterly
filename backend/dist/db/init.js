"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const database_1 = __importDefault(require("../config/database"));
// SQL to create the authors table
const createAuthorsTable = `
CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the genres table
const createGenresTable = `
CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the books table with foreign keys
const createBooksTable = `
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  description TEXT,
  isbn VARCHAR(13) UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  published_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the orders table
const createOrdersTable = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the order_items table
const createOrderItemsTable = `
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL CHECK (price_at_time >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// SQL to create the reviews table
const createReviewsTable = `
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, user_id)
);
`;
// SQL to create indexes
const createIndexes = `
-- Indexes for books table
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_genre_id ON books(genre_id);
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(book_id);

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
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

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at
BEFORE UPDATE ON authors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;
// Initialize the database
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create tables
            yield database_1.default.query(createAuthorsTable);
            console.log('Authors table created or already exists');
            yield database_1.default.query(createGenresTable);
            console.log('Genres table created or already exists');
            yield database_1.default.query(createBooksTable);
            console.log('Books table created or already exists');
            yield database_1.default.query(createUsersTable);
            console.log('Users table created or already exists');
            yield database_1.default.query(createOrdersTable);
            console.log('Orders table created or already exists');
            yield database_1.default.query(createOrderItemsTable);
            console.log('Order items table created or already exists');
            yield database_1.default.query(createReviewsTable);
            console.log('Reviews table created or already exists');
            // Create indexes
            yield database_1.default.query(createIndexes);
            console.log('Indexes created or already exist');
            // Create triggers
            yield database_1.default.query(createUpdateTimestampTrigger);
            console.log('Triggers created or already exist');
            return true;
        }
        catch (error) {
            console.error('Error initializing database:', error);
            return false;
        }
    });
}
