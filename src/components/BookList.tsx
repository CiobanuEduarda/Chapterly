"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { useBooks } from '../lib/bookContext';
import { Book } from '../lib/bookContext';
import { useInView } from 'react-intersection-observer';
import { useWebSocket } from '../lib/websocketContext';

interface BookListProps {
  onBookClick?: (book: Book) => void;
  onDeleteClick?: (id: number) => void;
}

export function BookList({ onBookClick, onDeleteClick }: BookListProps) {
  const { state, loadMoreBooks, setFilter, setSort, refreshBooks } = useBooks();
  const { books, isLoading, isOfflineMode, pagination } = state;
  const { isConnected, lastMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [filterRating, setFilterRating] = useState<number>(0);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  
  // Get unique genres for filter dropdown
  const genres = useMemo(() => {
    if (!books || books.length === 0) {
      return [];
    }
    return [...new Set(books.map((book) => book.genre))];
  }, [books]);
  
  // Use react-intersection-observer to detect when the user scrolls to the bottom
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Load more books when the user scrolls to the bottom
  useEffect(() => {
    if (useInfiniteScroll && inView && !isLoading && pagination.hasMore) {
      loadMoreBooks();
    }
  }, [inView, isLoading, pagination.hasMore, loadMoreBooks, useInfiniteScroll]);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'books') {
      // Get the updated books from the WebSocket message
      const updatedBooks = lastMessage.data;
      
      // Apply current filters and sorting to the updated books
      let filteredBooks = [...updatedBooks];
      
      // Apply search filter
      if (searchTerm) {
        filteredBooks = filteredBooks.filter(book => 
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply genre filter
      if (filterGenre) {
        filteredBooks = filteredBooks.filter(book => book.genre === filterGenre);
      }
      
      // Apply rating filter
      if (filterRating > 0) {
        filteredBooks = filteredBooks.filter(book => book.rating >= filterRating);
      }
      
      // Apply sorting
      if (sortField) {
        filteredBooks.sort((a, b) => {
          const aValue = String(a[sortField as keyof Book]);
          const bValue = String(b[sortField as keyof Book]);
          return sortDirection === "asc" ? 
            (aValue > bValue ? 1 : -1) : 
            (bValue > aValue ? 1 : -1);
        });
      }
      
      // Apply pagination if not using infinite scroll
      if (!useInfiniteScroll) {
        const startIndex = (currentPage - 1) * booksPerPage;
        const endIndex = startIndex + booksPerPage;
        filteredBooks = filteredBooks.slice(startIndex, endIndex);
      }
      
      // Update the books state directly in the context
      setFilter(null); // Reset filter to get all books
      setSort(null); // Reset sort to get all books
      
      // Force a refresh of the books
      refreshBooks();
    }
  }, [lastMessage, searchTerm, filterGenre, filterRating, sortField, sortDirection, refreshBooks, setFilter, setSort, useInfiniteScroll, currentPage, booksPerPage]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      refreshBooks();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshBooks]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce the filter update
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        setFilter(`title:${value}`);
      } else {
        setFilter(null);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    
    setSort(`${field}:${sortDirection === "asc" ? "desc" : "asc"}`);
  };

  // Handle genre filter change
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterGenre(value);
    
    if (value) {
      setFilter(`genre:${value}`);
    } else {
      setFilter(null);
    }
  };

  // Handle rating filter change
  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setFilterRating(value);
    
    if (value > 0) {
      setFilter(`rating:${value}`);
    } else {
      setFilter(null);
    }
  };

  // Find cheapest book with explicit type checks
  const cheapestBookId = useMemo(() => {
    if (books.length === 0) return null;
    
    const minPrice = Math.min(...books.map(book => book.price));
    const cheapestBook = books.find(book => book.price === minPrice);
    return cheapestBook?.id ?? null;
  }, [books]);

  // Handle page change for pagination mode
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      loadMoreBooks();
    }
  };

  // Handle books per page change
  const handleBooksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBooksPerPage = parseInt(e.target.value);
    setBooksPerPage(newBooksPerPage);
    setCurrentPage(1); // Reset to first page when changing books per page
    loadMoreBooks();
  };

  // Apply pagination to the displayed books
  const displayedBooks = useMemo(() => {
    if (!books || books.length === 0) {
      return [];
    }
    
    if (useInfiniteScroll) {
      return books;
    } else {
      const startIndex = (currentPage - 1) * booksPerPage;
      const endIndex = startIndex + booksPerPage;
      return books.slice(startIndex, endIndex);
    }
  }, [books, useInfiniteScroll, currentPage, booksPerPage]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#89A593] p-8">
      <h1 className="text-3xl font-bold bg-[#52796F] p-6 rounded-md shadow-md text-center text-[#042405]">
        Book Shelf
      </h1>

      {/* Filtering and Search */}
      <div className="bg-[#E1A591] p-6 rounded-md shadow-md mt-6">
        <div className="flex flex-wrap gap-4 justify-between">
          <div>
            <label className="text-lg font-semibold text-[#042405] mr-2">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by title or author"
              className="p-2 border border-black rounded-md"
            />
          </div>

          <div>
            <label className="text-lg font-semibold text-[#042405] mr-2">Genre:</label>
            <select
              value={filterGenre}
              onChange={handleGenreChange}
              className="p-2 border border-black rounded-md"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-lg font-semibold text-[#042405] mr-2">Rating:</label>
            <select
              value={filterRating}
              onChange={handleRatingChange}
              className="p-2 border border-black rounded-md"
            >
              <option value={0}>All Ratings</option>
              <option value={1}>1+ Star</option>
              <option value={2}>2+ Stars</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="infiniteScroll"
                checked={useInfiniteScroll}
                onChange={(e) => setUseInfiniteScroll(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="infiniteScroll" className="text-lg font-semibold text-[#042405]">
                Use Infinite Scroll
              </label>
            </div>

            {!useInfiniteScroll && (
              <div className="flex items-center">
                <label htmlFor="booksPerPage" className="text-lg font-semibold text-[#042405] mr-2">
                  Books per page:
                </label>
                <select
                  id="booksPerPage"
                  value={booksPerPage}
                  onChange={handleBooksPerPageChange}
                  className="p-2 border border-black rounded-md"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoRefresh" className="text-lg font-semibold text-[#042405] mr-2">
                Auto Refresh
              </label>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="p-2 border border-black rounded-md"
                >
                  <option value={5}>Every 5s</option>
                  <option value={10}>Every 10s</option>
                  <option value={30}>Every 30s</option>
                  <option value={60}>Every 1m</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-[#E1A591] p-6 rounded-md shadow-md mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#52796F] text-white">
              <th className="p-3 cursor-pointer" onClick={() => handleSortChange("title")}>
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 cursor-pointer" onClick={() => handleSortChange("author")}>
                Author {sortField === "author" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 cursor-pointer" onClick={() => handleSortChange("genre")}>
                Genre {sortField === "genre" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 cursor-pointer" onClick={() => handleSortChange("price")}>
                Price {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 cursor-pointer" onClick={() => handleSortChange("rating")}>
                Rating {sortField === "rating" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBooks.length > 0 ? (
              displayedBooks.map((book) => (
                <tr
                  key={book.id}
                  className={`border-b border-gray-300 hover:bg-[#C76E77]/20 
                    ${book.rating === 5 ? "bg-[#A1AD92]/40" : ""}
                    ${book.id === cheapestBookId ? "bg-[#89A593]/60" : ""}
                    ${book.genre === "Romance" ? "bg-[#C76E77]/60" : ""}
                  `}
                >
                  <td className="p-3">{book.title}</td>
                  <td className="p-3">{book.author}</td>
                  <td className="p-3">{book.genre}</td>
                  <td className="p-3">
                    ${book.price.toFixed(2)}
                    {book.id === cheapestBookId && (
                      <span className="ml-2 text-xs font-bold text-[#52796F] bg-white px-1 py-0.5 rounded">
                        BEST PRICE
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={`text-xl ${index < book.rating ? "text-[#C76E77]" : "text-gray-400"}`}
                      >
                        ★
                      </span>
                    ))}
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        className="px-2 py-1 bg-[#52796F] text-white rounded-md"
                        onClick={() => onBookClick?.(book)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteClick?.(book.id)}
                        className="px-2 py-1 bg-[#C76E77] text-white rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  No books found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Loading indicator and pagination */}
        {useInfiniteScroll ? (
          <div ref={ref} className="h-10 flex items-center justify-center my-4">
            {isLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            )}
            {!isLoading && pagination.hasMore && (
              <div className="text-sm text-gray-500">Scroll for more books...</div>
            )}
            {!isLoading && !pagination.hasMore && books.length > 0 && (
              <div className="text-sm text-gray-500">No more books to load</div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4 my-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#52796F] text-white hover:bg-[#3D5A4C]'
              }`}
            >
              Previous
            </button>
            <span className="text-[#042405]">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className={`px-4 py-2 rounded-md ${
                currentPage >= pagination.totalPages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#52796F] text-white hover:bg-[#3D5A4C]'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 