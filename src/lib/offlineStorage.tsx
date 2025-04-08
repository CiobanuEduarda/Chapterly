import { Book} from './bookContext';

export type OfflineOperation={
    id:string;
    type:'add'|'update'|'delete';
    timestamp:number;
    data:any;
    syncStatus:'pending'|'syncing'|'error';
    retryCount:number;
};

const STORAGE_KEYS={
    BOOKS:'offline_books',
    OPERATIONS:'offline_operations',
};

const MAX_RETRY_COUNT=3;

export const offlineStorage={
    saveBooks(books:Book[]){
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    },

    getBooks():Book[]{
       try{
        const booksJson=localStorage.getItem(STORAGE_KEYS.BOOKS);
        return booksJson ? JSON.parse(booksJson) : [];
       }catch(error){
        console.error('Error retrieving books from localStorage:', error);
        return [];
       }
    },

      // Queue an operation to be performed when back online
     queueOperation(type:'add'|'update'|'delete', data:any):string{
        const operations=this.getOperations();
        const newOperation:OfflineOperation={
            id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            timestamp: Date.now(),
            data,
            syncStatus: 'pending',
            retryCount: 0,

        };
        operations.push(newOperation);
        localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
    
        return newOperation.id;
     },
     getOperations(): OfflineOperation[] {
        try {
          const operationsJson = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
          return operationsJson ? JSON.parse(operationsJson) : [];
        } catch (error) {
          console.error('Failed to parse offline operations:', error);
          return [];
        }
      },
      // Update operation status
  updateOperationStatus(id: string, status: 'pending' | 'syncing' | 'error') {
    const operations = this.getOperations();
    const updatedOperations = operations.map(op => 
      op.id === id ? { ...op, syncStatus: status } : op
    );
    
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(updatedOperations));
  },

  // Increment retry count
  incrementRetryCount(id: string) {
    const operations = this.getOperations();
    const updatedOperations = operations.map(op => 
      op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
    );
    
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(updatedOperations));
    return updatedOperations.find(op => op.id === id)?.retryCount || 0;
  },

  // Remove an operation (after successful sync or max retries)
  removeOperation(id: string) {
    const operations = this.getOperations();
    const filteredOperations = operations.filter(op => op.id !== id);
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(filteredOperations));
  },

  // Clear all operations
  clearOperations() {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify([]));
  },

  // Get operation count
  getOperationCount(): number {
    return this.getOperations().length;
  },

  // Apply an operation to the local book cache
  applyOperationLocally(operation: OfflineOperation): Book[] {
    const books = this.getBooks();
    
    switch (operation.type) {
      case 'add': {
        const newBook = {
          ...operation.data,
          id: operation.data.id || Math.max(0, ...books.map(b => b.id)) + 1,
        };
        books.push(newBook);
        break;
      }
      case 'update': {
        const index = books.findIndex(book => book.id === operation.data.id);
        if (index !== -1) {
          books[index] = { ...books[index], ...operation.data.book };
        }
        break;
      }
      case 'delete': {
        const id = operation.data;
        return books.filter(book => book.id !== id);
      }
    }
    
    this.saveBooks(books);
    return books;
  },

  addBook(book: Omit<Book, 'id'>): Book {
    const books = this.getBooks();
    const newBook: Book = {
        ...book,
        id: Date.now(), // Use timestamp as temporary ID
    };
    books.push(newBook);
    this.saveBooks(books);
    return newBook;
  },

  updateBook(id: number, book: Omit<Book, 'id'>): Book {
    const books = this.getBooks();
    const updatedBook: Book = {
        ...book,
        id,
    };
    const updatedBooks = books.map(b => b.id === id ? updatedBook : b);
    this.saveBooks(updatedBooks);
    return updatedBook;
  },
};
       
