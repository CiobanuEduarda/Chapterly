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
  deleteBook: (id: number) => Promise<void>
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
    isLoading: true,
    isOfflineMode: false,
    pagination: {
      page: 1,
      limit: 20,
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
      
      setState(prev => ({
        ...prev,
        books: [...prev.books, ...response.books],
        isLoading: false,
        pagination: response.pagination
      }));
    } catch (error) {
      console.error('Failed to load more books:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      showToast('Failed to load more books', 'error');
    }
  }, [state.isLoading, state.pagination, filter, sort, showToast]);

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