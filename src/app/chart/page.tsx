"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
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

  const getRandomItem = (arr: string[]): string => {
    if (arr.length === 0) throw new Error('Array cannot be empty');
    const index = Math.floor(Math.random() * arr.length);
    return arr[index]!;
  }

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
    acc[book.genre] = (acc[book.genre] ?? 0) + 1;
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
    acc[book.rating] = (acc[book.rating] ?? 0) + 1;
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

interface WebSocketMessage {
  type: string;
  data: Book[];
}

interface ChartData {
  genreData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  ratingData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string;
    }[];
  };
  priceData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string;
    }[];
  };
}

export default function Dashboard() {
  const { isLoading, refreshChartData } = useCharts()
  const { state, addBook } = useBooks()
  const { isConnected, lastMessage } = useWebSocket()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Memoize the chart data processing
  const processedChartData = useMemo(() => {
    if (state.books.length === 0) return null;
    
    return {
      genreData: processGenreData(state.books),
      ratingData: processRatingData(state.books),
      priceData: processPriceData(state.books)
    };
  }, [state.books]);

  // Update chart data with debounce
  useEffect(() => {
    if (!processedChartData) return;

    const timeoutId = setTimeout(() => {
      setChartData(processedChartData);
      setLastUpdated(new Date());
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [processedChartData]);

  // Handle manual book generation
  const handleGenerateBook = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const newBook = generateRandomBook();
      await addBook(newBook);
    } finally {
      setIsGenerating(false);
    }
  }, [addBook, isGenerating]);

  // Update last updated time when chart data refreshes
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date())
    }
  }, [isLoading])

  // Format time for display
  const formatTime = useCallback((date: Date): string => {
    // Use 24-hour format consistently
    return date.toLocaleTimeString('en-GB', { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit",
      hour12: false 
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#89A593] p-8">
      <h1 className="text-3xl font-bold bg-[#52796F] p-6 rounded-md shadow-md text-center text-[#042405]">
        Book Analytics Dashboard
      </h1>

      {/* Connection Status */}
      <div className={`text-center p-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white rounded-md mt-4`}>
        {isConnected ? 'Connected to Real-Time Updates' : 'Disconnected'}
      </div>

      <div className="bg-[#E1A591] p-6 rounded-md shadow-md mt-6 flex justify-between items-center">
        <div>
          <span className="text-lg font-semibold text-[#042405]">Total Books: {state.books.length}</span>
          <span className="ml-4 text-sm text-[#042405]">Last Updated: {formatTime(lastUpdated)}</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleGenerateBook}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Book"}
          </button>
          <button
            onClick={() => void refreshChartData()}
            className="px-4 py-2 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black"
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-[#E1A591] p-6 rounded-md shadow-md mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#52796F]"></div>
        </div>
      ) : chartData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Genre Distribution */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Genre Distribution</h2>
            <div className="flex">
              <div className="w-1/2">
                <PieChart data={chartData.genreData} />
              </div>
              <div className="w-1/2">
                <Legend data={chartData.genreData} />
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Rating Distribution</h2>
            <BarChart data={chartData.ratingData} />
          </div>

          {/* Price Distribution */}
          <div className="bg-[#E1A591] p-6 rounded-md shadow-md">
            <h2 className="text-xl font-bold text-[#042405] mb-4">Price Distribution</h2>
            <LineChart data={chartData.priceData} />
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-[#E1A591] rounded-md shadow-md mt-6">
          <p className="text-[#042405]">No data available</p>
      </div>
      )}
    </div>
  )
}

// Pie Chart Component
function PieChart({ data }: { data: ChartData['genreData'] }) {
  const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) ?? 0;
  let currentAngle = 0;

  return (
    <svg width="400" height="400" viewBox="0 0 400 400">
    <g transform="translate(200, 200)">
        {data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] ?? 0;
          const startAngle = currentAngle;
          const angle = (value / total) * 360;
          const endAngle = startAngle + angle;
          currentAngle = endAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = Math.sin(startRad) * 150;
          const y1 = -Math.cos(startRad) * 150;
          const x2 = Math.sin(endRad) * 150;
          const y2 = -Math.cos(endRad) * 150;

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [`M 0 0`, `L ${x1} ${y1}`, `A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ");

          return (
            <path
              key={index}
              d={pathData}
              fill={data.datasets[0]?.backgroundColor[index] ?? '#000000'}
              stroke="#fff"
              strokeWidth="1"
            />
          );
      })}
    </g>
    </svg>
  );
}

// Legend Component
function Legend({ data }: { data: ChartData['genreData'] }) {
  return (
    <svg width="400" height="200" viewBox="0 0 400 200">
      <g transform="translate(200, 100)">
        {data.labels.map((label, index) => {
          const x = -180 + (index % 3) * 120;
          const y = Math.floor(index / 3) * 20;
          const value = data.datasets[0]?.data[index] ?? 0;

        return (
          <g key={index} transform={`translate(${x}, ${y})`}>
              <rect width="15" height="15" fill={data.datasets[0]?.backgroundColor[index] ?? '#000000'} />
            <text x="20" y="12" fontSize="12" fill="#042405">
                {label} ({value})
            </text>
          </g>
          );
      })}
    </g>
    </svg>
  );
}

// Bar Chart Component
function BarChart({ data }: { data: ChartData['ratingData'] }) {
  const maxRating = Math.max(...(data.datasets[0]?.data ?? [0]));
  const barWidth = 400 / (data.labels.length * 2);

  return (
    <svg width="400" height="400" viewBox="0 0 400 400">
    <g transform="translate(50, 20)">
      {/* Y-axis */}
      <line x1="0" y1="0" x2="0" y2="300" stroke="#042405" strokeWidth="2" />

      {/* X-axis */}
      <line x1="0" y1="300" x2="300" y2="300" stroke="#042405" strokeWidth="2" />

      {/* Y-axis labels */}
        {[0, Math.ceil(maxRating / 2), maxRating].map((rating, index) => (
          <g key={index} transform={`translate(-10, ${300 - (rating / maxRating) * 300})`}>
          <text textAnchor="end" fontSize="12" fill="#042405">
            {rating}
          </text>
        </g>
      ))}

      {/* Bars */}
        {data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] ?? 0;
          const barHeight = (value / maxRating) * 300;
          const x = index * (barWidth * 2) + barWidth / 2;

        return (
          <g key={index}>
              <rect 
                x={x} 
                y={300 - barHeight} 
                width={barWidth} 
                height={barHeight} 
                fill={data.datasets[0]?.backgroundColor ?? '#52796F'} 
              />
            <text x={x + barWidth / 2} y={300 - barHeight - 5} textAnchor="middle" fontSize="12" fill="#042405">
                {value}
            </text>
            <text
              x={x + barWidth / 2}
              y={320}
              textAnchor="middle"
              fontSize="12"
              fill="#042405"
              transform={`rotate(45, ${x + barWidth / 2}, 320)`}
            >
                {label}
            </text>
          </g>
          );
      })}
    </g>
    </svg>
  );
}

// Line Chart Component
function LineChart({ data }: { data: ChartData['priceData'] }) {
  const maxCount = Math.max(...(data.datasets[0]?.data ?? [0]));
  const pointSpacing = 300 / (data.labels.length - 1);

  // Generate points for the line
  const points = data.labels.map((label, index) => ({
    x: index * pointSpacing,
    y: 300 - ((data.datasets[0]?.data[index] ?? 0) / maxCount) * 280,
    label,
    count: data.datasets[0]?.data[index] ?? 0,
  }));

  // Create the line path
  const linePath = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ");

  return (
    <svg width="400" height="400" viewBox="0 0 400 400">
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
        <path d={linePath} fill="none" stroke={data.datasets[0]?.backgroundColor ?? '#C76E77'} strokeWidth="3" />

      {/* Points */}
      {points.map((point, index) => (
        <g key={index}>
            <circle cx={point.x} cy={point.y} r="5" fill={data.datasets[0]?.backgroundColor ?? '#C76E77'} />
          <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="12" fill="#042405">
            {point.count}
          </text>
        </g>
      ))}
    </g>
    </svg>
  );
}