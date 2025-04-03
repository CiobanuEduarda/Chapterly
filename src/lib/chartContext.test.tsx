import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, act, waitFor } from '@testing-library/react'
import { ChartProvider, useCharts } from './chartContext'
import { BookProvider } from './bookContext'

// Mock the useBooks hook
vi.mock('./bookContext', () => ({
  useBooks: () => ({
    state: {
      books: [
        { id: 1, title: 'Book 1', author: 'Author 1', genre: 'Fiction', price: 9.99, rating: 4 },
        { id: 2, title: 'Book 2', author: 'Author 2', genre: 'Fiction', price: 14.99, rating: 5 },
        { id: 3, title: 'Book 3', author: 'Author 3', genre: 'Non-Fiction', price: 19.99, rating: 3 },
        { id: 4, title: 'Book 4', author: 'Author 4', genre: 'Mystery', price: 24.99, rating: 4 }
      ]
    }
  }),
  BookProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChartProvider>{children}</ChartProvider>
)

describe('ChartContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useCharts(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('should process genre data correctly', async () => {
    const { result } = renderHook(() => useCharts(), { wrapper })

    // Fast-forward timers to complete the async operation
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.genreData).toHaveLength(3) // Fiction, Non-Fiction, Mystery
    const fictionData = result.current.genreData.find(d => d.genre === 'Fiction')
    expect(fictionData).toBeDefined()
    expect(fictionData?.count).toBe(2)
  })

  it('should process rating data correctly', async () => {
    const { result } = renderHook(() => useCharts(), { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.ratingData).toHaveLength(3)
    const fictionRating = result.current.ratingData.find(d => d.genre === 'Fiction')
    expect(fictionRating).toBeDefined()
    expect(fictionRating?.averageRating).toBe(4.5) // (4 + 5) / 2
  })

  it('should process price data correctly', async () => {
    const { result } = renderHook(() => useCharts(), { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.priceData).toHaveLength(5) // All price ranges
    expect(result.current.priceData.find(d => d.priceRange === '$5-$10')?.count).toBe(1)
    expect(result.current.priceData.find(d => d.priceRange === '$20+')?.count).toBe(1)
  })

  it('should throw error when useCharts is used outside ChartProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useCharts())
    }).toThrow('useCharts must be used within a ChartProvider')

    consoleError.mockRestore()
  })
}) 