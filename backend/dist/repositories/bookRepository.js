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
exports.getBooks = getBooks;
exports.getBookById = getBookById;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
const database_1 = __importDefault(require("../config/database"));
// Get all books with pagination, filtering, and sorting
function getBooks() {
    return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, filter, sort) {
        try {
            let query = `
      SELECT 
        b.id, 
        b.title, 
        a.name as author, 
        g.name as genre, 
        b.price, 
        b.rating,
        b.description,
        b.isbn,
        b.stock_quantity,
        b.published_date,
        b.created_at,
        b.updated_at
      FROM books b
      JOIN authors a ON b.author_id = a.id
      LEFT JOIN genres g ON b.genre_id = g.id
    `;
            const queryParams = [];
            let countQuery = `
      SELECT COUNT(*)
      FROM books b
      JOIN authors a ON b.author_id = a.id
      LEFT JOIN genres g ON b.genre_id = g.id
    `;
            let whereClause = '';
            let orderClause = '';
            // Apply filtering
            if (filter) {
                const [field, value] = filter.split(':');
                if (field === 'author') {
                    whereClause = ` WHERE a.name ILIKE $1`;
                }
                else if (field === 'genre') {
                    whereClause = ` WHERE g.name ILIKE $1`;
                }
                else {
                    whereClause = ` WHERE b.${field} ILIKE $1`;
                }
                queryParams.push(`%${value}%`);
            }
            // Apply sorting
            if (sort) {
                const [field, direction] = sort.split(':');
                if (field === 'author') {
                    orderClause = ` ORDER BY a.name ${direction.toUpperCase()}`;
                }
                else if (field === 'genre') {
                    orderClause = ` ORDER BY g.name ${direction.toUpperCase()}`;
                }
                else {
                    orderClause = ` ORDER BY b.${field} ${direction.toUpperCase()}`;
                }
            }
            else {
                orderClause = ' ORDER BY b.id ASC';
            }
            // Add pagination
            const offset = (page - 1) * limit;
            queryParams.push(limit, offset);
            query += whereClause + orderClause + ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
            countQuery += whereClause;
            // Execute queries
            const [booksResult, countResult] = yield Promise.all([
                database_1.default.query(query, queryParams),
                database_1.default.query(countQuery, queryParams.slice(0, -2))
            ]);
            return {
                books: booksResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        }
        catch (error) {
            console.error('Error getting books:', error);
            throw error;
        }
    });
}
// Get a book by ID
function getBookById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query(`
      SELECT 
        b.id, 
        b.title, 
        a.name as author, 
        g.name as genre, 
        b.price, 
        b.rating,
        b.description,
        b.isbn,
        b.stock_quantity,
        b.published_date,
        b.created_at,
        b.updated_at
      FROM books b
      JOIN authors a ON b.author_id = a.id
      LEFT JOIN genres g ON b.genre_id = g.id
      WHERE b.id = $1
    `, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting book with ID ${id}:`, error);
            throw error;
        }
    });
}
// Create a new book
function createBook(book) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            yield client.query('BEGIN');
            // First, get or create the author
            const authorResult = yield client.query('INSERT INTO authors (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [book.author]);
            const authorId = authorResult.rows[0].id;
            // Then, get or create the genre if provided
            let genreId = null;
            if (book.genre) {
                const genreResult = yield client.query('INSERT INTO genres (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [book.genre]);
                genreId = genreResult.rows[0].id;
            }
            // Finally, create the book
            const result = yield client.query(`INSERT INTO books (
        title, author_id, genre_id, price, rating, 
        description, isbn, stock_quantity, published_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [
                book.title,
                authorId,
                genreId,
                book.price,
                book.rating,
                book.description || null,
                book.isbn || null,
                book.stock_quantity || 0,
                book.published_date || null
            ]);
            // Get the full book details with author and genre names
            const fullBook = yield getBookById(result.rows[0].id);
            yield client.query('COMMIT');
            return fullBook;
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error creating book:', error);
            throw error;
        }
        finally {
            client.release();
        }
    });
}
// Update a book
function updateBook(id, book) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { title, author, genre, price, rating, description, isbn, stock_quantity, published_date } = book;
            // First, get or create the author
            const authorResult = yield database_1.default.query('INSERT INTO authors (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [author]);
            const authorId = authorResult.rows[0].id;
            // Then, get or create the genre if provided
            let genreId = null;
            if (genre) {
                const genreResult = yield database_1.default.query('INSERT INTO genres (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [genre]);
                genreId = genreResult.rows[0].id;
            }
            // Update the book
            const result = yield database_1.default.query(`UPDATE books SET 
        title = $1, 
        author_id = $2, 
        genre_id = $3, 
        price = $4, 
        rating = $5,
        description = $6,
        isbn = $7,
        stock_quantity = $8,
        published_date = $9
      WHERE id = $10 RETURNING *`, [title, authorId, genreId, price, rating, description, isbn, stock_quantity, published_date, id]);
            if (!result.rows[0]) {
                return null;
            }
            // Get the full book details with author and genre names
            const fullBook = yield getBookById(id);
            return fullBook;
        }
        catch (error) {
            console.error(`Error updating book with ID ${id}:`, error);
            throw error;
        }
    });
}
// Delete a book
function deleteBook(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield database_1.default.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        }
        catch (error) {
            console.error(`Error deleting book with ID ${id}:`, error);
            throw error;
        }
    });
}
