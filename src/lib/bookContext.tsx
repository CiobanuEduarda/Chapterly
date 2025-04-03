"use client"
import { createContext, useContext, useReducer, type ReactNode } from "react"

// Define the structure of a Book object
export type Book = {
  id: number
  title: string
  author: string
  genre: string
  price: number
  rating: number
}

// Define the structure of the global book state
type BookState = {
  books: Book[]
}

// Define possible actions for modifying the book state
type BookAction =
  | { type: "ADD_BOOK"; payload: Omit<Book, "id"> } // Adds a book (without an ID, since it will be generated)
  | { type: "UPDATE_BOOK"; payload: Book } // Updates an existing book
  | { type: "DELETE_BOOK"; payload: number } // Deletes a book by ID

// Define the context type, including state and action functions
type BookContextType = {
  state: BookState
  addBook: (book: Omit<Book, "id">) => void
  updateBook: (book: Book) => void
  deleteBook: (id: number) => void
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
const BookContext = createContext<BookContextType>({
  state: initialState,
  addBook: () => {},
  updateBook: () => {},
  deleteBook: () => {},
})

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
export function BookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookReducer, initialState)

  // Function to add a new book
  const addBook = (book: Omit<Book, "id">) => {
    dispatch({ type: "ADD_BOOK", payload: book })
  }

  // Function to update an existing book
  const updateBook = (book: Book) => {
    dispatch({ type: "UPDATE_BOOK", payload: book })
  }

  // Function to delete a book by ID
  const deleteBook = (id: number) => {
    dispatch({ type: "DELETE_BOOK", payload: id })
  }

  // Provide state and functions to children components
  const value = {
    state,
    addBook,
    updateBook,
    deleteBook,
  }

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>
}

// Custom hook for accessing the book context
export function useBooks() {
  const context = useContext(BookContext)
  if (!context) {
    throw new Error("useBooks must be used within a BookProvider")
  }
  return context
}
