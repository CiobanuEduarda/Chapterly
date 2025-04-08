import { Book } from './bookContext';
import { offlineStorage } from './offlineStorage';

const API_URL = 'http://localhost:3001/api';

export const api = {
  baseUrl: API_URL,

  async getBooks(sort?: string, filter?: string) {
    try {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (filter) params.append('filter', filter);
      
      const response = await fetch(`${API_URL}/books?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch books');
      
      const books = await response.json();
      
      // Cache books for offline use
      offlineStorage.saveBooks(books);
      
      return books;
    } catch (error) {
      console.warn('Using offline books due to error:', error);
      return offlineStorage.getBooks();
    }
  },

  async addBook(book: Omit<Book, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      
      if (!response.ok) throw new Error('Failed to add book');
      
      return response.json();
    } catch (error) {
      // Queue the operation for later sync
      const operationId = offlineStorage.queueOperation('add', book);
      
      // Create a temporary book with a local ID
      const localBooks = offlineStorage.getBooks();
      const tempId = Math.max(0, ...localBooks.map(b => b.id)) + 1;
      const tempBook = { ...book, id: tempId };
      
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

  async updateBook(id: number, book: Omit<Book, 'id'>) {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      
      if (!response.ok) throw new Error('Failed to update book');
      
      return response.json();
    } catch (error) {
      // Queue the operation for later sync
      const operationId = offlineStorage.queueOperation('update', { id, book });
      
      // Apply the operation locally
      offlineStorage.applyOperationLocally({ 
        id: operationId, 
        type: 'update', 
        timestamp: Date.now(), 
        data: { id, book },
        syncStatus: 'pending',
        retryCount: 0
      });
      
      // Return the updated book
      return { id, ...book };
    }
  },

  async deleteBook(id: number) {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete book');
    } catch (error) {
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
  async syncOfflineOperations() {
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
            await this.addBook(operation.data);
            break;
          }
          case 'update': {
            const { id, book } = operation.data;
            await this.updateBook(id, book);
            break;
          }
          case 'delete': {
            await this.deleteBook(operation.data);
            break;
          }
        }
        
        // Operation succeeded, remove it from the queue
        offlineStorage.removeOperation(operation.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
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