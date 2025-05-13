"use client"
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, PaginationParams, PaginatedResponse } from './api';
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

// Define the structure of the book state
interface BookState {
  books: Book[]
  isLoading: boolean
  isOfflineMode: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Define the structure of the book context
interface BookContextType {
  state: BookState
  addBook: (book: Omit<Book, 'id'>) => Promise<Book>
  updateBook: (id: number, book: Omit<Book, 'id'>) => Promise<Book>
  deleteBook: (id: number) => Promise<boolean>
  refreshBooks: () => Promise<void>
  loadMoreBooks: () => Promise<void>
  setFilter: (filter: string | null) => void
  setSort: (sort: string | null) => void
}

// Create a React context to provide global state management
const BookContext = createContext<BookContextType | undefined>(undefined);

// Provider component that wraps the application and provides the book context
export function BookProvider({ children }: { children: React.ReactNode }) {
  const { status } = useNetwork();
  const { showToast } = useToast();
  const [state, setState] = useState<BookState>({
    books: [],
    isLoading: false,
    isOfflineMode: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasMore: false
    }
  });
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>(null);

  const refreshBooks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const params: PaginationParams = {
        page: 1,
        limit: state.pagination.limit
      };
      
      if (filter) params.filter = filter;
      if (sort) params.sort = sort;
      
      const response = await api.getBooks(params);
      
      setState({
        books: response.books,
        isLoading: false,
        isOfflineMode: status !== 'online',
        pagination: response.pagination
      });
    } catch (error) {
      console.error('Failed to fetch books:', error);
      
      // If fetch fails, try to get books from offline storage
      const offlineBooks = offlineStorage.getBooks();
      
      setState({
        books: offlineBooks,
        isLoading: false,
        isOfflineMode: true,
        pagination: {
          page: 1,
          limit: offlineBooks.length,
          total: offlineBooks.length,
          totalPages: 1,
          hasMore: false
        }
      });
      
      if (offlineBooks.length > 0) {
        showToast('Using offline book data', 'info');
      }
    }
  }, [status, showToast, filter, sort, state.pagination.limit]);

  const loadMoreBooks = useCallback(async () => {
    if (state.isLoading || !state.pagination.hasMore) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const nextPage = state.pagination.page + 1;
      
      const params: PaginationParams = {
        page: nextPage,
        limit: state.pagination.limit
      };
      
      if (filter) params.filter = filter;
      if (sort) params.sort = sort;
      
      const response = await api.getBooks(params);
      
      // Create a Set of existing book IDs for quick lookup
      const existingIds = new Set(state.books.map(book => book.id));
      
      // Filter out any books that already exist in the current list
      const newBooks = response.books.filter(book => !existingIds.has(book.id));
      
      setState(prev => ({
        ...prev,
        books: [...prev.books, ...newBooks],
        isLoading: false,
        pagination: response.pagination
      }));
    } catch (error) {
      console.error('Failed to load more books:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      showToast('Failed to load more books', 'error');
    }
  }, [state.isLoading, state.pagination, filter, sort, showToast]);

  const addBook = useCallback(async (book: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const response = await fetch('http://localhost:3001/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });

      if (!response.ok) {
        throw new Error('Failed to add book');
      }

      const newBook = await response.json();

      // Update local state
      setState(prev => ({
        ...prev,
        books: [...prev.books, newBook]
      }));

      return newBook;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }, []);

  const deleteBook = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3001/api/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        books: prev.books.filter(book => book.id !== id)
      }));

      return true;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }, []);

  const updateBook = useCallback(async (id: number, book: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const response = await fetch(`http://localhost:3001/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });

      if (!response.ok) {
        throw new Error('Failed to update book');
      }

      const updatedBook = await response.json();

      // Update local state
      setState(prev => ({
        ...prev,
        books: prev.books.map(b => b.id === id ? updatedBook : b)
      }));

      return updatedBook;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }, []);

  // Load books on mount and when network status, filter, or sort changes
  useEffect(() => {
    refreshBooks();
  }, [refreshBooks, filter, sort]);

  // Provide state and functions to children components
  const value: BookContextType = {
    state,
    addBook,
    updateBook,
    deleteBook,
    refreshBooks,
    loadMoreBooks,
    setFilter,
    setSort
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

// Custom hook to use the book context
export function useBooks() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
}