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
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../db/init");
const bookRepository = __importStar(require("../repositories/bookRepository"));
const DEFAULT_USER_ID = 1; // Default user ID for seeding
const sampleBooks = [
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        price: 12.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        price: 14.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: '1984',
        author: 'George Orwell',
        genre: 'Science Fiction',
        price: 11.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        price: 9.99,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        price: 15.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        genre: 'Fiction',
        price: 10.99,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        price: 19.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        genre: 'Fiction',
        price: 13.99,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Little Prince',
        author: 'Antoine de Saint-Exupéry',
        genre: 'Fiction',
        price: 8.99,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    },
    {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        genre: 'Mystery',
        price: 16.99,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: DEFAULT_USER_ID
    }
];
async function seed() {
    try {
        // Initialize the database
        await (0, init_1.initializeDatabase)();
        console.log('Database initialized');
        // Clear existing books
        await bookRepository.deleteAllBooks();
        console.log('Existing books cleared');
        // Insert sample books
        for (const book of sampleBooks) {
            await bookRepository.createBook(book, DEFAULT_USER_ID);
        }
        console.log('Sample books inserted successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map