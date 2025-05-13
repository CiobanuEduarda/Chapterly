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
const database_1 = __importDefault(require("../config/database"));
// Sample books data
const sampleBooks = [
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        price: 12.99,
        rating: 5,
        stock_quantity: 10
    },
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        price: 10.99,
        rating: 5,
        stock_quantity: 15
    },
    {
        title: '1984',
        author: 'George Orwell',
        genre: 'Science Fiction',
        price: 9.99,
        rating: 4,
        stock_quantity: 8
    },
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        price: 8.99,
        rating: 5,
        stock_quantity: 12
    },
    {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        price: 14.99,
        rating: 5,
        stock_quantity: 20
    },
    {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        genre: 'Fiction',
        price: 11.99,
        rating: 4,
        stock_quantity: 7
    },
    {
        title: 'Lord of the Flies',
        author: 'William Golding',
        genre: 'Fiction',
        price: 9.99,
        rating: 4,
        stock_quantity: 9
    },
    {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        genre: 'Fiction',
        price: 10.99,
        rating: 5,
        stock_quantity: 25
    },
    {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        genre: 'Science Fiction',
        price: 11.99,
        rating: 4,
        stock_quantity: 11
    },
    {
        title: 'The Little Prince',
        author: 'Antoine de Saint-Exupéry',
        genre: 'Fiction',
        price: 7.99,
        rating: 5,
        stock_quantity: 30
    }
];
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            console.log('Seeding database...');
            yield client.query('BEGIN');
            // Clear existing data
            yield client.query('TRUNCATE TABLE books, authors, genres RESTART IDENTITY CASCADE');
            console.log('Cleared existing data');
            // Insert authors first
            for (const book of sampleBooks) {
                yield client.query('INSERT INTO authors (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [book.author]);
            }
            console.log('Inserted authors');
            // Insert genres
            for (const book of sampleBooks) {
                yield client.query('INSERT INTO genres (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [book.genre]);
            }
            console.log('Inserted genres');
            // Now insert the books with proper foreign keys
            for (const book of sampleBooks) {
                const authorResult = yield client.query('SELECT id FROM authors WHERE name = $1', [book.author]);
                const genreResult = yield client.query('SELECT id FROM genres WHERE name = $1', [book.genre]);
                yield client.query(`INSERT INTO books (
          title, author_id, genre_id, price, rating, stock_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [
                    book.title,
                    authorResult.rows[0].id,
                    genreResult.rows[0].id,
                    book.price,
                    book.rating,
                    book.stock_quantity
                ]);
            }
            yield client.query('COMMIT');
            console.log(`Inserted ${sampleBooks.length} sample books`);
            console.log('Database seeded successfully');
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error seeding database:', error);
            throw error;
        }
        finally {
            client.release();
            process.exit(0);
        }
    });
}
seedDatabase();
