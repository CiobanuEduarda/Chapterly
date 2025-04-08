"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useCharts } from "../../lib/chartContext"
import { useBooks, type Book } from "../../lib/bookContext"
import { useWebSocket } from '../../lib/websocketContext';

// Add this function before the Dashboard component
function generateRandomBook(): Omit<Book, "id"> {
  const genres = ["Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction", "Fantasy", "Biography", "History", "Poetry", "Thriller"]
  const authors = [
    "Jane Austen", "Charles Dickens", "William Shakespeare", "Mark Twain", "Virginia Woolf",
    "Ernest Hemingway", "George Orwell", "J.K. Rowling", "Stephen King", "Agatha Christie"
  ]
  const titles = [
    "The Midnight Garden", "Echoes of Time", "The Last Horizon", "Whispers in the Wind",
    "Beyond the Stars", "The Hidden Path", "Shadows of Yesterday", "The Golden Key",
    "A New Dawn", "The Silent Forest"
  ]

  const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!

  return {
    title: getRandomItem(titles),
    author: getRandomItem(authors),
    genre: getRandomItem(genres),
    price: Number((Math.random() * 30 + 5).toFixed(2)),
    rating: Math.floor(Math.random() * 3) + 3 // Random rating between 3 and 5
  }
}

// Data processing functions
const processGenreData = (books: Book[]) => {
  const genreCounts = books.reduce((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(genreCounts),
    datasets: [{
      data: Object.values(genreCounts),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };
};

const processRatingData = (books: Book[]) => {
  const ratingCounts = books.reduce((acc, book) => {
    acc[book.rating] = (acc[book.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    labels: Object.keys(ratingCounts).map(rating => `${rating} Stars`),
    datasets: [{
      data: Object.values(ratingCounts),
      backgroundColor: '#36A2EB'
    }]
  };
};

const processPriceData = (books: Book[]) => {
  const priceRanges = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81+': 0
  };

  books.forEach(book => {
    if (book.price <= 20) priceRanges['0-20']++;
    else if (book.price <= 40) priceRanges['21-40']++;
    else if (book.price <= 60) priceRanges['41-60']++;
    else if (book.price <= 80) priceRanges['61-80']++;
    else priceRanges['81+']++;
  });

  return {
    labels: Object.keys(priceRanges),
    datasets: [{
      data: Object.values(priceRanges),
      backgroundColor: '#FF6384'
    }]
  };
};

export default function Dashboard() {
  const { genreData, ratingData, priceData, isLoading, refreshChartData } = useCharts()
  const { state, addBook } = useBooks()
  const { isConnected, lastMessage } = useWebSocket()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [chartData, setChartData] = useState<any>(null)

  // Add this useEffect for periodic book addition
  useEffect(() => {
    const interval = setInterval(() => {
      const newBook = generateRandomBook()
      addBook(newBook)
    }, 5000) // Add a new book every 5 seconds

    return () => clearInterval(interval)
  }, [addBook])

  // Update last updated time when chart data refreshes
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date())
    }
  }, [isLoading])

  // Update chart data when books change or WebSocket message received
  useEffect(() => {
    if (lastMessage?.type === 'books' || state.books.length > 0) {
      // Process books data for charts
      const genreData = processGenreData(state.books)
      const ratingData = processRatingData(state.books)
      const priceData = processPriceData(state.books)

      setChartData({
        genreData,
        ratingData,
        priceData
      })
    }
  }, [state.books, lastMessage])

 

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#89A593] p-8">
      <h1 className="text-3xl font-bold bg-[#52796F] p-6 rounded-md shadow-md text-center text-[#042405]">
        Book Analytics Dashboard
      </h1>

      {/* Connection Status */}
      <div className={`text-center p-2 ${true? 'bg-green-500' : 'bg-red-500'} text-white rounded-md mt-4`}>
        {isConnected ? 'Disconnected' : 'Connected to Real-Time Updates'}
      </div>

      <div className="bg-[#E1A591] p-6 rounded-md shadow-md mt-6 flex justify-between items-center">
        <div>
          <span className="text-lg font-semibold text-[#042405]">Total Books: {state.books.length}</span>
       
        </div>
        <button
          onClick={refreshChartData}
          className="px-4 py-2 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-[#E1A591] p-6 rounded-md shadow-md mt-6">
          <div className="text-2xl font-bold text-[#042405]">Loading chart data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Genre Distribution Chart */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Books by Genre</h2>
            <div className="h-64 relative">
              <svg width="100%" height="100%" viewBox="0 0 400 400">
                {genreData.length > 0 ? (
                  <>
                    <PieChart data={genreData} />
                    <Legend data={genreData} />
                  </>
                ) : (
                  <text x="50%" y="50%" textAnchor="middle" className="text-lg font-semibold">
                    No genre data available
                  </text>
                )}
              </svg>
            </div>
          </div>

          {/* Average Rating Chart */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Average Rating by Genre</h2>
            <div className="h-64 relative">
              <svg width="100%" height="100%" viewBox="0 0 400 400">
                {ratingData.length > 0 ? (
                  <BarChart data={ratingData} />
                ) : (
                  <text x="50%" y="50%" textAnchor="middle" className="text-lg font-semibold">
                    No rating data available
                  </text>
                )}
              </svg>
            </div>
          </div>

          {/* Price Distribution Chart */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Price Distribution</h2>
            <div className="h-64 relative">
              <svg width="100%" height="100%" viewBox="0 0 400 400">
                {priceData.length > 0 ? (
                  <LineChart data={priceData} />
                ) : (
                  <text x="50%" y="50%" textAnchor="middle" className="text-lg font-semibold">
                    No price data available
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link href="/bookshelf">
          <button className="px-6 py-3 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black">
            Go to Book Shelf
          </button>
        </Link>
      </div>

      <div className="mt-4 flex justify-center">
        <Link href="/">
          <button className="px-6 py-3 bg-[#C76E77] text-[#042405] font-bold rounded-md shadow-md border border-black">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  )
}

// Pie Chart Component
function PieChart({ data }: { data: { genre: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  let currentAngle = 0

  return (
    <g transform="translate(200, 200)">
      {data.map((item, index) => {
        const startAngle = currentAngle
        const angle = (item.count / total) * 360
        const endAngle = startAngle + angle
        currentAngle = endAngle

        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        const x1 = Math.sin(startRad) * 150
        const y1 = -Math.cos(startRad) * 150
        const x2 = Math.sin(endRad) * 150
        const y2 = -Math.cos(endRad) * 150

        const largeArcFlag = angle > 180 ? 1 : 0

        const pathData = [`M 0 0`, `L ${x1} ${y1}`, `A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

        return <path key={index} d={pathData} fill={item.color} stroke="#fff" strokeWidth="1" />
      })}
    </g>
  )
}

// Legend Component
function Legend({ data }: { data: { genre: string; count: number; color: string }[] }) {
  return (
    <g transform="translate(200, 350)">
      {data.map((item, index) => {
        const x = -180 + (index % 3) * 120
        const y = Math.floor(index / 3) * 20

        return (
          <g key={index} transform={`translate(${x}, ${y})`}>
            <rect width="15" height="15" fill={item.color} />
            <text x="20" y="12" fontSize="12" fill="#042405">
              {item.genre} ({item.count})
            </text>
          </g>
        )
      })}
    </g>
  )
}

// Bar Chart Component
function BarChart({ data }: { data: { genre: string; averageRating: number }[] }) {
  const maxRating = 5
  const barWidth = 400 / (data.length * 2)

  return (
    <g transform="translate(50, 20)">
      {/* Y-axis */}
      <line x1="0" y1="0" x2="0" y2="300" stroke="#042405" strokeWidth="2" />

      {/* X-axis */}
      <line x1="0" y1="300" x2="300" y2="300" stroke="#042405" strokeWidth="2" />

      {/* Y-axis labels */}
      {[0, 1, 2, 3, 4, 5].map((rating) => (
        <g key={rating} transform={`translate(-10, ${300 - (rating / maxRating) * 300})`}>
          <text textAnchor="end" fontSize="12" fill="#042405">
            {rating}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.averageRating / maxRating) * 300
        const x = index * (barWidth * 2) + barWidth / 2

        return (
          <g key={index}>
            <rect x={x} y={300 - barHeight} width={barWidth} height={barHeight} fill="#52796F" />
            <text x={x + barWidth / 2} y={300 - barHeight - 5} textAnchor="middle" fontSize="12" fill="#042405">
              {item.averageRating}
            </text>
            <text
              x={x + barWidth / 2}
              y={320}
              textAnchor="middle"
              fontSize="12"
              fill="#042405"
              transform={`rotate(45, ${x + barWidth / 2}, 320)`}
            >
              {item.genre}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// Line Chart Component
function LineChart({ data }: { data: { priceRange: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((item) => item.count))
  const pointSpacing = 300 / (data.length - 1)

  // Generate points for the line
  const points = data.map((item, index) => ({
    x: index * pointSpacing,
    y: 300 - (item.count / maxCount) * 280,
    label: item.priceRange,
    count: item.count,
  }))

  // Create the line path
  const linePath = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ")

  return (
    <g transform="translate(50, 20)">
      {/* Y-axis */}
      <line x1="0" y1="0" x2="0" y2="300" stroke="#042405" strokeWidth="2" />

      {/* X-axis */}
      <line x1="0" y1="300" x2="300" y2="300" stroke="#042405" strokeWidth="2" />

      {/* Y-axis labels */}
      {[0, Math.ceil(maxCount / 2), maxCount].map((count, index) => (
        <g key={index} transform={`translate(-10, ${300 - (count / maxCount) * 280})`}>
          <text textAnchor="end" fontSize="12" fill="#042405">
            {count}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((point, index) => (
        <g key={index} transform={`translate(${point.x}, 320)`}>
          <text textAnchor="middle" fontSize="12" fill="#042405" transform={`rotate(45, 0, 0)`}>
            {point.label}
          </text>
        </g>
      ))}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#C76E77" strokeWidth="3" />

      {/* Points */}
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r="5" fill="#C76E77" />
          <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="12" fill="#042405">
            {point.count}
          </text>
        </g>
      ))}
    </g>
  )
}