"use client"
import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

// Define the structure of a Book object
export interface Book {
  id: number
  title: string
  author: string
  genre: string
  price: number
  rating: number
}

// Define the structure of the global book state
interface BookState {
  books: Book[]
}

// Define possible actions for modifying the book state
type BookAction =
  | { type: "ADD_BOOK"; payload: Omit<Book, "id"> } // Adds a book (without an ID, since it will be generated)
  | { type: "UPDATE_BOOK"; payload: Book } // Updates an existing book
  | { type: "DELETE_BOOK"; payload: number } // Deletes a book by ID

// Define the context type, including state and action functions
interface BookContextType {
  state: BookState
  addBook: (book: Omit<Book, 'id'>) => Promise<void>
  updateBook: (id: number, book: Omit<Book, 'id'>) => Promise<void>
  deleteBook: (id: number) => Promise<void>
  refreshBooks: () => Promise<void>
}

// Initial state with some sample books
const initialState: BookState = {
  books: [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic", price: 5, rating: 4 },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", price: 9, rating: 5 },
    { id: 3, title: "1984", author: "George Orwell", genre: "Dystopian", price: 9.99, rating: 4 },
    { id: 4, title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", price: 5.22, rating: 3 },
  ],
}

// Create a React context to provide global state management
const BookContext = createContext<BookContextType | undefined>(undefined);

// Reducer function to handle different actions and update the state
function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case "ADD_BOOK":
      return {
        ...state,
        books: [
          ...state.books,
          {
            ...action.payload,
            id: Math.max(0, ...state.books.map((b) => b.id)) + 1, // Generate a new unique ID
          },
        ],
      }
    case "UPDATE_BOOK":
      return {
        ...state,
        books: state.books.map((book) => (book.id === action.payload.id ? action.payload : book)),
      }
    case "DELETE_BOOK":
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload),
      }
    default:
      return state
  }
}

// Provider component that wraps the application and provides the book context
export function BookProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookState>({ books: [] });

  const refreshBooks = useCallback(async () => {
    try {
      const books = await api.getBooks();
      setState({ books });
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  }, []);

  const addBook = useCallback(async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await api.addBook(book);
      setState(prev => ({ books: [...prev.books, newBook] }));
    } catch (error) {
      console.error('Failed to add book:', error);
      throw error;
    }
  }, []);

  const updateBook = useCallback(async (id: number, book: Omit<Book, 'id'>) => {
    try {
      const updatedBook = await api.updateBook(id, book);
      setState(prev => ({
        books: prev.books.map(b => b.id === id ? updatedBook : b)
      }));
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  }, []);

  const deleteBook = useCallback(async (id: number) => {
    try {
      await api.deleteBook(id);
      setState(prev => ({
        books: prev.books.filter(book => book.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw error;
    }
  }, []);

  // Load books on mount
  React.useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  // Provide state and functions to children components
  const value: BookContextType = {
    state,
    addBook,
    updateBook,
    deleteBook,
    refreshBooks,
  }

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>
}

// Custom hook for accessing the book context
export function useBooks() {
  const context = useContext(BookContext)
  if (context === undefined) {
    throw new Error("useBooks must be used within a BookProvider")
  }
  return context
}
