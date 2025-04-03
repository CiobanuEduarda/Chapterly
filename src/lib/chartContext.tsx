"use client"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useBooks, type Book } from "./bookContext"

// Define chart data types
export type GenreChartData = {
  genre: string
  count: number
  color: string
}

export type RatingChartData = {
  genre: string
  averageRating: number
}

export type PriceChartData = {
  priceRange: string
  count: number
}

type ChartContextType = {
  genreData: GenreChartData[]
  ratingData: RatingChartData[]
  priceData: PriceChartData[]
  isLoading: boolean
  refreshChartData: () => void
}

// Create context
const ChartContext = createContext<ChartContextType | undefined>(undefined)

// Generate random color
const getRandomColor = () => {
  const colors = [
    "#52796F", "#84A98C", "#CAD2C5", "#C76E77", "#A1AD92", "#89A593", "#6E8876", "#5F7764",
    "#B5CDA3", "#A3B18A", "#D9BF77", "#E9C46A", "#F4A261", "#E76F51", "#2A9D8F", "#264653", "#F4E1D2",
    "#8D99AE", "#EDF2F4", "#EF233C", "#D90429", "#2B2D42", "#8E9AAF", "#CBC0D3", "#EFD3D7", "#FEEAFA",
    "#9A8C98", "#C9ADA7", "#F2E9E4", "#22223B", "#4A4E69", "#9A8C98", "#C9ADA7", "#F2E9E4", "#22223B",
    "#4A4E69", "#6D6875", "#B5838D", "#E5989B", "#FFB4A2", "#FFCDB2", "#FFDDD2", "#E29578", "#6D6875"
  ];
  return colors[Math.floor(Math.random() * colors.length)] || "#000000"
}

// Provider component
export function ChartProvider({ children }: { children: React.ReactNode }) {
  const { state } = useBooks()
  const [genreData, setGenreData] = useState<GenreChartData[]>([])
  const [ratingData, setRatingData] = useState<RatingChartData[]>([])
  const [priceData, setPriceData] = useState<PriceChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Function to generate chart data asynchronously
  const generateChartData = async (books: Book[]) => {
    setIsLoading(true)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Process genre data
    const genreMap = new Map<string, number>()
    const genreRatingMap = new Map<string, number[]>()

    books.forEach((book) => {
      // Genre count
      genreMap.set(book.genre, (genreMap.get(book.genre) || 0) + 1)

      // Genre ratings
      if (!genreRatingMap.has(book.genre)) {
        genreRatingMap.set(book.genre, [])
      }
      genreRatingMap.get(book.genre)?.push(book.rating)
    })

    // Create genre chart data
    const newGenreData: GenreChartData[] = Array.from(genreMap.entries()).map(([genre, count]) => ({
      genre,
      count,
      color: getRandomColor(),
    }))

    // Create rating chart data
    const newRatingData: RatingChartData[] = Array.from(genreRatingMap.entries()).map(([genre, ratings]) => {
      const sum = ratings.reduce((acc, rating) => acc + rating, 0)
      return {
        genre,
        averageRating: Number.parseFloat((sum / ratings.length).toFixed(1)),
      }
    })

    // Process price data
    const priceRanges = [
      { min: 0, max: 5, label: "$0-$5" },
      { min: 5, max: 10, label: "$5-$10" },
      { min: 10, max: 15, label: "$10-$15" },
      { min: 15, max: 20, label: "$15-$20" },
      { min: 20, max: Number.POSITIVE_INFINITY, label: "$20+" },
    ]

    const priceDistribution = priceRanges.map((range) => {
      const count = books.filter((book) => book.price >= range.min && book.price < range.max).length

      return {
        priceRange: range.label,
        count,
      }
    })

    setGenreData(newGenreData)
    setRatingData(newRatingData)
    setPriceData(priceDistribution)
    setIsLoading(false)
  }

  // Refresh chart data
  const refreshChartData = () => {
    generateChartData(state.books)
  }

  // Update chart data when books change
  useEffect(() => {
    generateChartData(state.books)
  }, [state.books])

  return (
    <ChartContext.Provider
      value={{
        genreData,
        ratingData,
        priceData,
        isLoading,
        refreshChartData,
      }}
    >
      {children}
    </ChartContext.Provider>
  )
}

// Custom hook to use the chart context
export function useCharts() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("useCharts must be used within a ChartProvider")
  }
  return context
}

