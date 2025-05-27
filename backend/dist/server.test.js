// @ts-nocheck
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("./server"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const bookRepository = __importStar(require("./repositories/bookRepository"));
const socket_io_client_1 = require("socket.io-client");
// Mock the book repository
jest.mock('./repositories/bookRepository', () => ({
    getBooks: jest.fn(),
    getBookById: jest.fn(),
    createBook: jest.fn(),
    updateBook: jest.fn(),
    deleteBook: jest.fn()
}));
describe('Book API', () => {
    const testBook = {
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Fiction',
        price: 10.99,
        rating: 4
    };
    let httpServer;
    let io;
    let clientSocket;
    beforeAll((done) => {
        httpServer = (0, http_1.createServer)(server_1.default);
        io = new socket_io_1.Server(httpServer);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
    });
    afterAll(() => {
        io.close();
        httpServer.close();
    });
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });
    describe('GET /api/books', () => {
        it('should return empty array when no books exist', async () => {
            bookRepository.getBooks.mockResolvedValue({ books: [], total: 0 });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .expect(200);
            expect(response.body.books).toEqual([]);
            expect(response.body.pagination).toBeDefined();
        });
        it('should return all books with pagination', async () => {
            const testBooks = [
                { id: 1, ...testBook },
                { id: 2, title: 'Another Book', author: 'Another Author', genre: 'Non-Fiction', price: 15.99, rating: 5 }
            ];
            bookRepository.getBooks.mockResolvedValue({ books: testBooks, total: 2 });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .query({ page: 1, limit: 10 })
                .expect(200);
            expect(response.body.books).toHaveLength(2);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
                hasMore: false
            });
        });
        it('should filter books by title', async () => {
            const testBooks = [
                { id: 1, ...testBook }
            ];
            bookRepository.getBooks.mockResolvedValue({ books: testBooks, total: 1 });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .query({ filter: 'title:Test' })
                .expect(200);
            expect(response.body.books).toHaveLength(1);
            expect(response.body.books[0].title).toBe('Test Book');
        });
        it('should sort books by price', async () => {
            const testBooks = [
                { id: 1, ...testBook },
                { id: 2, title: 'Another Book', author: 'Another Author', genre: 'Non-Fiction', price: 15.99, rating: 5 }
            ];
            bookRepository.getBooks.mockResolvedValue({ books: testBooks, total: 2 });
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .query({ sort: 'price:asc' })
                .expect(200);
            expect(response.body.books[0].price).toBe(10.99);
            expect(response.body.books[1].price).toBe(15.99);
        });
    });
    describe('GET /api/books/:id', () => {
        it('should return a specific book', async () => {
            const book = { id: 1, ...testBook };
            bookRepository.getBookById.mockResolvedValue(book);
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books/1')
                .expect(200);
            expect(response.body).toEqual(book);
        });
        it('should return 404 for non-existent book', async () => {
            bookRepository.getBookById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books/999')
                .expect(404);
            expect(response.body.error).toBe('Book not found');
        });
        it('should validate ID parameter', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/books/invalid')
                .expect(400);
            expect(response.body.error).toBe('Invalid ID parameter');
        });
    });
    describe('POST /api/books', () => {
        it('should create a new book', async () => {
            const newBook = { id: 1, ...testBook };
            bookRepository.createBook.mockResolvedValue(newBook);
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send(testBook)
                .expect(201);
            expect(response.body).toEqual(newBook);
        });
        it('should validate required fields', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send({ title: 'Test Book' })
                .expect(400);
            expect(response.body.error).toBe('Missing required fields');
        });
        it('should validate price is positive', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send({ ...testBook, price: -10 })
                .expect(400);
            expect(response.body.error).toBe('Price must be a positive number');
        });
        it('should validate rating is between 1 and 5', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send({ ...testBook, rating: 6 })
                .expect(400);
            expect(response.body.error).toBe('Rating must be between 1 and 5');
        });
    });
    describe('PUT /api/books/:id', () => {
        it('should update an existing book', async () => {
            const updatedBook = { id: 1, ...testBook, title: 'Updated Title' };
            bookRepository.updateBook.mockResolvedValue(updatedBook);
            const response = await (0, supertest_1.default)(server_1.default)
                .put('/api/books/1')
                .send({ ...testBook, title: 'Updated Title' })
                .expect(200);
            expect(response.body.title).toBe('Updated Title');
        });
        it('should return 404 for non-existent book', async () => {
            bookRepository.updateBook.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.default)
                .put('/api/books/999')
                .send(testBook)
                .expect(404);
            expect(response.body.error).toBe('Book not found');
        });
        it('should validate update data', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .put('/api/books/1')
                .send({ ...testBook, price: -10 })
                .expect(400);
            expect(response.body.error).toBe('Price must be a positive number');
        });
    });
    describe('DELETE /api/books/:id', () => {
        it('should delete an existing book', async () => {
            bookRepository.deleteBook.mockResolvedValue(true);
            await (0, supertest_1.default)(server_1.default)
                .delete('/api/books/1')
                .expect(204);
        });
        it('should return 404 for non-existent book', async () => {
            bookRepository.deleteBook.mockResolvedValue(false);
            const response = await (0, supertest_1.default)(server_1.default)
                .delete('/api/books/999')
                .expect(404);
            expect(response.body.error).toBe('Book not found');
        });
    });
    describe('File Operations', () => {
        const testFilePath = path_1.default.join(__dirname, 'test.txt');
        beforeAll(() => {
            // Create a test file
            fs_1.default.writeFileSync(testFilePath, 'Test content');
        });
        afterAll(() => {
            // Clean up test file
            if (fs_1.default.existsSync(testFilePath)) {
                fs_1.default.unlinkSync(testFilePath);
            }
        });
        it('should upload a file', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/upload')
                .attach('file', testFilePath)
                .expect(200);
            expect(response.body).toMatchObject({
                filename: expect.any(String),
                originalname: 'test.txt',
                size: expect.any(Number),
                mimetype: expect.any(String)
            });
        });
        it('should return 400 when no file is uploaded', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .post('/api/upload')
                .expect(400);
            expect(response.body.error).toBe('No file uploaded');
        });
        it('should list uploaded files', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/files')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('should download a file', async () => {
            // First upload a file
            const uploadResponse = await (0, supertest_1.default)(server_1.default)
                .post('/api/upload')
                .attach('file', testFilePath);
            const filename = uploadResponse.body.filename;
            // Then try to download it
            const response = await (0, supertest_1.default)(server_1.default)
                .get(`/api/download/${filename}`)
                .expect(200);
            expect(response.header['content-disposition']).toContain(filename);
        });
        it('should return 404 when downloading non-existent file', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/api/download/nonexistent.txt')
                .expect(404);
            expect(response.body.error).toBe('File not found');
        });
        it('should delete a file', async () => {
            // First upload a file
            const uploadResponse = await (0, supertest_1.default)(server_1.default)
                .post('/api/upload')
                .attach('file', testFilePath);
            const filename = uploadResponse.body.filename;
            // Then delete it
            await (0, supertest_1.default)(server_1.default)
                .delete(`/api/files/${filename}`)
                .expect(204);
        });
        it('should return 404 when deleting non-existent file', async () => {
            const response = await (0, supertest_1.default)(server_1.default)
                .delete('/api/files/nonexistent.txt')
                .expect(404);
            expect(response.body.error).toBe('File not found');
        });
    });
});
//# sourceMappingURL=server.test.js.map