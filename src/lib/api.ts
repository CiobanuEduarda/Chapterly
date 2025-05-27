import type { Book } from './bookContext';
import { offlineStorage } from './offlineStorage';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
  genre?: string;
  rating?: number;
}

export interface PaginatedResponse<T> {
  books: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ApiResponse<T> {
  books: T[];
  pagination: PaginatedResponse<T>['pagination'];
}

export const api = {
  async getBooks(params?: PaginationParams): Promise<PaginatedResponse<Book>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.filter) queryParams.append('filter', params.filter);
      if (params?.genre) queryParams.append('genre', params.genre);
      if (params?.rating) queryParams.append('rating', params.rating.toString());

      const response = await fetch(`/api/books?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch books');
      }

      const data = await response.json() as ApiResponse<Book>;
      
      // Cache books for offline use
      offlineStorage.saveBooks(data.books);
      
      return data;
    } catch (error) {
      console.warn('Using offline books due to error:', error);
      const offlineBooks = offlineStorage.getBooks();
      return {
        books: offlineBooks,
        pagination: {
          total: offlineBooks.length,
          page: 1,
          limit: offlineBooks.length,
          totalPages: 1,
          hasMore: false
        }
      };
    }
  },

  async addBook(book: Omit<Book, 'id'>): Promise<Book> {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(book),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to add book');
      }
      
      return response.json() as Promise<Book>;
    } catch (error) {
      console.warn('Using offline storage due to error:', error);
      // Create a temporary book with a local ID
      const localBooks = offlineStorage.getBooks();
      const tempId = Math.max(0, ...localBooks.map(b => b.id)) + 1;
      const tempBook = { ...book, id: tempId };
      
      // Queue the operation for later sync
      const operationId = offlineStorage.queueOperation('add', tempBook);
      
      // Apply the operation locally
      offlineStorage.applyOperationLocally({ 
        id: operationId, 
        type: 'add', 
        timestamp: Date.now(), 
        data: tempBook,
        syncStatus: 'pending',
        retryCount: 0
      });
      
      // Return the temp book
      return tempBook;
    }
  },

  async updateBook(id: number, book: Omit<Book, 'id'>): Promise<Book> {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(book),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to update book');
      }
      
      return response.json() as Promise<Book>;
    } catch (error) {
      console.warn('Using offline storage due to error:', error);
      const updatedBook = { ...book, id };
      
      // Queue the operation for later sync
      const operationId = offlineStorage.queueOperation('update', { id, book: updatedBook });
      
      // Apply the operation locally
      offlineStorage.applyOperationLocally({ 
        id: operationId, 
        type: 'update', 
        timestamp: Date.now(), 
        data: { id, book: updatedBook },
        syncStatus: 'pending',
        retryCount: 0
      });
      
      // Return the updated book
      return updatedBook;
    }
  },

  async deleteBook(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to delete book');
      }
    } catch (error) {
      console.warn('Using offline storage due to error:', error);
      // Queue the operation for later sync
      offlineStorage.queueOperation('delete', id);
      
      // Apply the operation locally
      offlineStorage.applyOperationLocally({ 
        id: `delete_${id}`, 
        type: 'delete', 
        timestamp: Date.now(), 
        data: id,
        syncStatus: 'pending',
        retryCount: 0
      });
    }
  },

  // Function to sync pending operations with the server
  async syncOfflineOperations(): Promise<{ success: boolean; synced: number; failed: number }> {
    const operations = offlineStorage.getOperations();
    
    if (operations.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Sort operations by timestamp (oldest first)
    const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const operation of sortedOps) {
      try {
        offlineStorage.updateOperationStatus(operation.id, 'syncing');
        
        switch (operation.type) {
          case 'add': {
            await this.addBook(operation.data as Omit<Book, 'id'>);
            break;
          }
          case 'update': {
            const { id, book } = operation.data as { id: number; book: Omit<Book, 'id'> };
            await this.updateBook(id, book);
            break;
          }
          case 'delete': {
            await this.deleteBook(operation.data as number);
            break;
          }
        }
        
        // Operation succeeded, remove it from the queue
        offlineStorage.removeOperation(operation.id);
        successCount++;
      } catch {
        console.error(`Failed to sync operation ${operation.id}`);
        
        // Update status to error
        offlineStorage.updateOperationStatus(operation.id, 'error');
        
        // Increment retry count
        const retryCount = offlineStorage.incrementRetryCount(operation.id);
        
        // If max retries reached, remove the operation
        if (retryCount >= 3) {
          offlineStorage.removeOperation(operation.id);
        }
        
        failCount++;
      }
    }
    
    return { success: failCount === 0, synced: successCount, failed: failCount };
  }
};