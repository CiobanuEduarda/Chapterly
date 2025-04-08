"use client"
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from './api';
import { useNetwork } from './networkContext';
import { useToast } from './toastContext';
import { offlineStorage } from './offlineStorage';

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
  isLoading: boolean
  isOfflineMode: boolean
}

// Define the context type, including state and action functions
interface BookContextType {
  state: BookState
  addBook: (book: Omit<Book, 'id'>) => Promise<void>
  updateBook: (id: number, book: Omit<Book, 'id'>) => Promise<void>
  deleteBook: (id: number) => Promise<void>
  refreshBooks: () => Promise<void>
}

// Create a React context to provide global state management
const BookContext = createContext<BookContextType | undefined>(undefined);

// Provider component that wraps the application and provides the book context
export function BookProvider({ children }: { children: React.ReactNode }) {
  const { status } = useNetwork();
  const { showToast } = useToast();
  const [state, setState] = useState<BookState>({ 
    books: [], 
    isLoading: true,
    isOfflineMode: false
  });

  const refreshBooks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const books = await api.getBooks();
      
      setState({
        books,
        isLoading: false,
        isOfflineMode: status !== 'online'
      });
    } catch (error) {
      console.error('Failed to fetch books:', error);
      
      // If fetch fails, try to get books from offline storage
      const offlineBooks = offlineStorage.getBooks();
      
      setState({
        books: offlineBooks,
        isLoading: false,
        isOfflineMode: true
      });
      
      if (offlineBooks.length > 0) {
        showToast('Using offline book data', 'info');
      }
    }
  }, [status, showToast]);

  const addBook = useCallback(async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await api.addBook(book);
      setState(prev => ({ 
        ...prev,
        books: [...prev.books, newBook],
        isOfflineMode: status !== 'online'
      }));
      
      if (status !== 'online') {
        showToast('Book added in offline mode', 'info');
      } else {
        showToast('Book added successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to add book:', error);
      showToast('Failed to add book', 'error');
      throw error;
    }
  }, [status, showToast]);

  const updateBook = useCallback(async (id: number, book: Omit<Book, 'id'>) => {
    try {
      const updatedBook = await api.updateBook(id, book);
      setState(prev => ({
        ...prev,
        books: prev.books.map(b => b.id === id ? updatedBook : b),
        isOfflineMode: status !== 'online'
      }));
      
      if (status !== 'online') {
        showToast('Book updated in offline mode', 'info');
      } else {
        showToast('Book updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to update book:', error);
      showToast('Failed to update book', 'error');
      throw error;
    }
  }, [status, showToast]);

  const deleteBook = useCallback(async (id: number) => {
    try {
      await api.deleteBook(id);
      setState(prev => ({
        ...prev,
        books: prev.books.filter(book => book.id !== id),
        isOfflineMode: status !== 'online'
      }));
      
      if (status !== 'online') {
        showToast('Book deleted in offline mode', 'info');
      } else {
        showToast('Book deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
      showToast('Failed to delete book', 'error');
      throw error;
    }
  }, [status, showToast]);

  // Load books on mount and when network status changes
  useEffect(() => {
    refreshBooks();
  }, [refreshBooks, status]);

  // Provide state and functions to children components
  const value: BookContextType = {
    state,
    addBook,
    updateBook,
    deleteBook,
    refreshBooks,
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

// Custom hook for accessing the book context
export function useBooks() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error("useBooks must be used within a BookProvider");
  }
  return context;
}