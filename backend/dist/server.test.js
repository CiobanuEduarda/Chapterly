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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importStar(require("./server"));
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
        server_1.books.length = 0;
    });
    describe('GET /api/books', () => {
        it('should return empty array when no books exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .expect(200);
            expect(response.body).toEqual([]);
        }));
        it('should return all books', () => __awaiter(void 0, void 0, void 0, function* () {
            // Add a test book
            const book = Object.assign({ id: 1 }, testBook);
            server_1.books.push(book);
            const response = yield (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .expect(200);
            expect(response.body).toEqual([book]);
        }));
        it('should filter books by title', () => __awaiter(void 0, void 0, void 0, function* () {
            const testBooks = [
                Object.assign({ id: 1 }, testBook),
                { id: 2, title: 'Another Book', author: 'Another Author', genre: 'Non-Fiction', price: 15.99, rating: 5 }
            ];
            server_1.books.push(...testBooks);
            const response = yield (0, supertest_1.default)(server_1.default)
                .get('/api/books')
                .query({ filter: 'title:Test' })
                .expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].title).toBe('Test Book');
        }));
    });
    describe('POST /api/books', () => {
        it('should create a new book', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send(testBook)
                .expect(201);
            expect(response.body).toMatchObject(Object.assign({ id: expect.any(Number) }, testBook));
        }));
        it('should validate required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send({ title: 'Test Book' })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        }));
        it('should validate price is positive', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send(Object.assign(Object.assign({}, testBook), { price: -10 }))
                .expect(400);
            expect(response.body.errors).toBeDefined();
        }));
        it('should validate rating is between 1 and 5', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/books')
                .send(Object.assign(Object.assign({}, testBook), { rating: 6 }))
                .expect(400);
            expect(response.body.errors).toBeDefined();
        }));
    });
    describe('PUT /api/books/:id', () => {
        it('should update an existing book', () => __awaiter(void 0, void 0, void 0, function* () {
            const book = Object.assign({ id: 1 }, testBook);
            server_1.books.push(book);
            const updatedBook = Object.assign(Object.assign({}, testBook), { title: 'Updated Title' });
            const response = yield (0, supertest_1.default)(server_1.default)
                .put('/api/books/1')
                .send(updatedBook)
                .expect(200);
            expect(response.body.title).toBe('Updated Title');
        }));
        it('should return 404 for non-existent book', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .put('/api/books/999')
                .send(testBook)
                .expect(404);
            expect(response.body.message).toBe('Book not found');
        }));
        it('should validate update data', () => __awaiter(void 0, void 0, void 0, function* () {
            const book = Object.assign({ id: 1 }, testBook);
            server_1.books.push(book);
            const response = yield (0, supertest_1.default)(server_1.default)
                .put('/api/books/1')
                .send(Object.assign(Object.assign({}, testBook), { price: -10 }))
                .expect(400);
            expect(response.body.errors).toBeDefined();
        }));
    });
    describe('DELETE /api/books/:id', () => {
        it('should delete an existing book', () => __awaiter(void 0, void 0, void 0, function* () {
            const book = Object.assign({ id: 1 }, testBook);
            server_1.books.push(book);
            yield (0, supertest_1.default)(server_1.default)
                .delete('/api/books/1')
                .expect(204);
            expect(server_1.books).toHaveLength(0);
        }));
        it('should return 404 for non-existent book', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .delete('/api/books/999')
                .expect(404);
            expect(response.body.message).toBe('Book not found');
        }));
    });
});
