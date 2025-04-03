"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooks } from "../../lib/bookContext"
import { useToast } from "../../lib/toastContext"

export default function BookShelf() {
  const router = useRouter()
  const { state, deleteBook } = useBooks()
  const books = state.books

  const { showToast } = useToast()
  // Sorting and filtering state
  const [sortField, setSortField] = useState<string>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterGenre, setFilterGenre] = useState<string>("")
  const [filterRating, setFilterRating] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false)
  const [bookToDelete, setBookToDelete] = useState<number | null>(null)
  const [bookToDeleteTitle, setBookToDeleteTitle] = useState<string>("")
  // Get unique genres for filter dropdown
  const genres = [...new Set(books.map((book) => book.genre))]


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [booksPerPage, setBooksPerPage] = useState(5)

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle delete confirmation
  const confirmDelete = (id: number) => {
    const book = books.find((b) => b.id === id)
    if (book) {
      setBookToDelete(id)
      setBookToDeleteTitle(book.title)  // Store the title for the toast
      setShowConfirmDelete(true)
    }
  }

  // Handle delete book
  const handleDeleteBook = () => {
    if (bookToDelete !== null) {
      deleteBook(bookToDelete)
      setShowConfirmDelete(false)
      setBookToDelete(null)
      showToast(`"${bookToDeleteTitle}" has been deleted`, "success")  // Show toast with book title
    }
  }

  // Apply sorting and filtering
  const filteredBooks = books
    .filter((book) => !filterGenre || book.genre === filterGenre)
    .filter((book) => !filterRating || book.rating >= filterRating)
    .filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof typeof a]
      const bValue = b[sortField as keyof typeof b]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      return 0
    })

  //cheapest book
  const cheapestBookId = useMemo(()=>{
    if (filteredBooks.length==0)
      return null
    let minPrice = filteredBooks[0] || { price: Infinity, id: null }
    for (const b of filteredBooks)
      if (b.price<minPrice.price)
        minPrice=b
    return minPrice.id

  },[filteredBooks])

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage)
  const indexOfLastBook = currentPage * booksPerPage
  const indexOfFirstBook = indexOfLastBook - booksPerPage
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook)
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Handle books per page change
  const handleBooksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBooksPerPage(Number(e.target.value))
    setCurrentPage(1) }// Reset to first page when changing items per page
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or author"
              className="p-2 border border-black rounded-md"
            />
          </div>

          <div>
            <label className="text-lg font-semibold text-[#042405] mr-2">Genre:</label>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
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
              onChange={(e) => setFilterRating(Number(e.target.value))}
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
            {currentBooks.length > 0 ? (
              currentBooks.map((book) => (
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
                        onClick={() => router.push(`/update/${book.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(book.id)}
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

         {/* Pagination Controls */}
         <div className="mt-6 flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <span className="text-[#042405] mr-2 font-semibold">Books per page:</span>
            <select
              value={booksPerPage}
              onChange={handleBooksPerPageChange}
              className="p-1 border border-[#C76E77] rounded-md bg-white text-[#042405]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-4 text-[#042405] font-semibold">
              Showing {indexOfFirstBook + 1}-{Math.min(indexOfLastBook, filteredBooks.length)} of {filteredBooks.length}{" "}
              books
            </span>
          </div>

          <div className="flex mt-2 sm:mt-0">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 mx-1 rounded-md ${
                currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-[#52796F] text-white"
              }`}
            >
              Prev
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 mx-1 rounded-md ${
                  currentPage === number ? "bg-[#C76E77] text-white" : "bg-[#52796F] text-white"
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 mx-1 rounded-md ${
                currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-[#52796F] text-white"
              }`}
            >
              Next 
            </button>
          </div>
        </div>
      </div>
        
      

      {/* Add Book Button */}
      <div className="mt-6 flex justify-center space-x-4">
        <Link href="/add">
          <button className="px-6 py-3 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black">
            Add New Book
          </button>
        </Link>
      

      {/* chart Book Button */}
      
      <Link href="/chart">
        <button className="px-6 py-3 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black">
          View Analytics
        </button>
      </Link>
    </div>

      {/* Back to Home Button */}
      <div className="mt-4 flex justify-center">
        <Link href="/">
          <button className="px-6 py-3 bg-[#C76E77] text-[#042405] font-bold rounded-md shadow-md border border-black">
            Back to Home
          </button>
        </Link>
      </div>

     
      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
            <div className="bg-[#C76E77] m-4 p-6 rounded-md">
              <p className="text-center text-white text-xl">
                Are you sure
                <br />
                you want to
                <br />
                delete this
                <br />
                book?
              </p>
            </div>
            <div className="flex justify-between px-4 pb-4">
              <button onClick={handleDeleteBook} className="bg-[#52796F] text-white p-2 rounded-md w-24 m-2">
                Yes
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="bg-[#C76E77] text-white p-2 rounded-md w-24 m-2"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
