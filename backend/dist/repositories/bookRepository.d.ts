import { Book } from '@prisma/client';
export declare function getBooks(page?: number, limit?: number, filter?: string, sort?: string, userId?: number): Promise<{
    books: Book[];
    total: number;
}>;
export declare function getBookById(id: number): Promise<Book | null>;
export declare function createBook(book: Omit<Book, 'id'>, userId: number): Promise<Book>;
export declare function updateBook(id: number, book: Omit<Book, 'id'>): Promise<Book | null>;
export declare function deleteBook(id: number): Promise<boolean>;
export declare function deleteAllBooks(): Promise<void>;
