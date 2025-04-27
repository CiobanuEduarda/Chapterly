import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import { BookProvider, useBooks, type Book } from './bookContext'

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BookProvider>{children}</BookProvider>
)

describe('BookContext CRUD Operations', () => {
  
  

  // Test Create operation
  it('should add a new book', () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    const initialLength = result.current.state.books.length

    act(() => {
      result.current.addBook({
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Test Genre',
        price: 19.99,
        rating: 4
      })
    })

    expect(result.current.state.books).toHaveLength(initialLength + 1)
    expect(result.current.state.books[initialLength]).toMatchObject({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Test Genre',
      price: 19.99,
      rating: 4
    })
  })

  // Test Read operation
  it('should retrieve books correctly', () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    
    // Check if books have all required properties
    result.current.state.books.forEach(book => {
      expect(book).toHaveProperty('id')
      expect(book).toHaveProperty('title')
      expect(book).toHaveProperty('author')
      expect(book).toHaveProperty('genre')
      expect(book).toHaveProperty('price')
      expect(book).toHaveProperty('rating')
    })
  })

  // Test Update operation
  it('should update an existing book', () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    const firstBook = result.current.state.books[0]
    
    if (!firstBook) {
      throw new Error('No books available for testing')
    }

    act(() => {
      const updatedBook: Book = {
        ...firstBook,
        title: 'Updated Title',
        price: 29.99
      }
      result.current.updateBook(updatedBook)
    })

    const updatedBook = result.current.state.books.find(book => book.id === firstBook.id)
    expect(updatedBook).toBeDefined()
    expect(updatedBook).toMatchObject({
      id: firstBook.id,
      title: 'Updated Title',
      price: 29.99
    })
  })

  // Test Delete operation
  it('should delete a book', () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    const initialLength = result.current.state.books.length
    const firstBook = result.current.state.books[0]
    
    if (!firstBook) {
      throw new Error('No books available for testing')
    }

    act(() => {
      result.current.deleteBook(firstBook.id)
    })

    expect(result.current.state.books).toHaveLength(initialLength - 1)
    expect(result.current.state.books.find(book => book.id === firstBook.id)).toBeUndefined()
  })

  // Test ID generation
  it('should generate unique IDs for new books', () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    const existingIds = new Set(result.current.state.books.map(book => book.id))

    act(() => {
      result.current.addBook({
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Genre 1',
        price: 19.99,
        rating: 4
      })
      result.current.addBook({
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Genre 2',
        price: 29.99,
        rating: 5
      })
    })

    const newBooks = result.current.state.books.slice(-2)
    newBooks.forEach(book => {
      expect(existingIds.has(book.id)).toBe(false)
      expect(book.id).toBeGreaterThan(Math.max(...existingIds))
    })
  })

  it("should handle unknown action type in reducer", () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: BookProvider,
    })

    const initialLength = result.current.state.books.length
    const initialBooks = [...result.current.state.books]

    // Try to update a book with invalid data
    act(() => {
      result.current.updateBook(
        -1, // Invalid ID
        {
          title: "",
          author: "",
          genre: "",
          price: -1,
          rating: -1,
        }
      )
    })

    // Should maintain the same state
    expect(result.current.state.books).toHaveLength(initialLength)
    expect(result.current.state.books).toEqual(initialBooks)
  })
}) 