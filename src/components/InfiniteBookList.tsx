import React, { useEffect, useRef, useCallback } from 'react';
import { useBooks, Book } from '../lib/bookContext';

interface BookItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-[#52796F]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-[#2F3E46]">{book.title}</h3>
          <p className="text-sm text-[#52796F]">by {book.author}</p>
          <div className="mt-2">
            <span className="inline-block bg-[#CAD2C5] text-[#2F3E46] text-xs px-2 py-1 rounded mr-2">
              {book.genre}
            </span>
            <span className="inline-block bg-[#84A98C] text-white text-xs px-2 py-1 rounded mr-2">
              ${book.price.toFixed(2)}
            </span>
            <span className="inline-block bg-[#52796F] text-white text-xs px-2 py-1 rounded">
              Rating: {book.rating}/5
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(book)}
            className="text-xs px-2 py-1 bg-[#84A98C] text-white rounded hover:bg-[#52796F]"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(book.id)}
            className="text-xs px-2 py-1 bg-[#C76E77] text-white rounded hover:bg-[#B25D67]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface InfiniteBookListProps {
  onEditBook: (book: Book) => void;
}

export const InfiniteBookList: React.FC<InfiniteBookListProps> = ({ onEditBook }) => {
  const { state, deleteBook, loadMoreBooks, hasMoreBooks } = useBooks();
  const { books, isLoading, isLoadingMore } = state;
  
  // Create a ref for the sentinel element (last book in the list)
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastBookElementRef = useRef<HTMLDivElement | null>(null);
  
  // Callback for when a book becomes visible
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreBooks && !isLoadingMore) {
        loadMoreBooks();
      }
    },
    [hasMoreBooks, isLoadingMore, loadMoreBooks]
  );
  
  // Set up the intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: '100px', // Start loading when sentinel is 100px from viewport
      threshold: 0.1, // Trigger when at least 10% of the sentinel is visible
    });
    
    if (lastBookElementRef.current) {
      observerRef.current.observe(lastBookElementRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, books.length]);
  
  // Handle book deletion
  const handleDeleteBook = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      await deleteBook(id);
    }
  };
  
  if (isLoading && books.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#52796F]"></div>
      </div>
    );
  }
  
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-lg text-[#52796F] mb-2">No books found</p>
        <p className="text-sm text-gray-500">Add some books to get started</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {books.map((book, index) => {
        if (index === books.length - 1) {
          // This is the last book, attach the ref to it
          return (
            <div key={book.id} ref={lastBookElementRef}>
              <BookItem book={book} onEdit={onEditBook} onDelete={handleDeleteBook} />
            </div>
          );
        } else {
          return (
            <BookItem key={book.id} book={book} onEdit={onEditBook} onDelete={handleDeleteBook} />
          );
        }
      })}
      
      {isLoadingMore && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#52796F]"></div>
        </div>
      )}
      
      {!isLoadingMore && !hasMoreBooks && books.length > 0 && (
        <div className="text-center p-4 text-sm text-gray-500">
          No more books to load
        </div>
      )}
    </div>
  );
};