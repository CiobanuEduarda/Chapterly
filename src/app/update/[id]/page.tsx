"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter, useParams } from "next/navigation"
import { useBooks, type Book } from "../../../lib/bookContext"
import { useToast } from "../../../lib/toastContext"
import Link from "next/link"

export default function EditBook() {
  const router = useRouter()
  const params = useParams()
  const bookId = Number(params.id)

  const { state, updateBook } = useBooks()
  const { showToast } = useToast()

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [genre, setGenre] = useState("")
  const [price, setPrice] = useState("")
  const [rating, setRating] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Find the book in the state
  useEffect(() => {
    const book = state.books.find((b) => b.id === bookId)

    if (book) {
      setTitle(book.title)
      setAuthor(book.author)
      setGenre(book.genre)
      setPrice(book.price.toString())
      setRating(book.rating)
      setLoading(false)
    } else {
      setNotFound(true)
      setLoading(false)
    }
  }, [bookId, state.books])

  const notebooks = [
    { color: "bg-[#52796F]", label: "Title", value: title, setValue: setTitle },
    { color: "bg-[#C76E77]", label: "Author", value: author, setValue: setAuthor },
    { color: "bg-[#52796F]", label: "Genre", value: genre, setValue: setGenre },
    { color: "bg-[#C76E77]", label: "Price", value: price, setValue: setPrice },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!author.trim()) newErrors.author = "Author is required"
    if (!genre.trim()) newErrors.genre = "Genre is required"

    if (!price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number.parseFloat(price)) || Number.parseFloat(price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (rating === 0) newErrors.rating = "Please select a rating"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      const updatedBook: Book = {
        id: bookId,
        title,
        author,
        genre,
        price: Number.parseFloat(price),
        rating,
      }

      updateBook(updatedBook)
      showToast(`"${title}" has been updated`, "success")
      router.push("/bookshelf")
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#E1A591] flex items-center justify-center">
        <div className="text-2xl font-bold text-[#042405]">Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="w-full min-h-screen bg-[#E1A591] flex flex-col items-center justify-center p-8">
        <div className="text-2xl font-bold text-[#042405] mb-6">Book not found</div>
        <Link href="/bookshelf">
          <button className="px-6 py-3 bg-[#52796F] text-white font-bold rounded-md shadow-md border border-black">
            Back to Book Shelf
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full items-center bg-[#E1A591] text-[#042405] p-0 text-center min-h-screen">
      <h1 className="text-3xl font-bold bg-[#52796F] p-10 rounded-md shadow-md text-center w-full">Edit Book</h1>

      <form onSubmit={handleSubmit}>
        {/* Rating Section */}
        <div className="mt-10 text-2xl font-semibold items-center gap-2">
          <span>Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-2xl cursor-pointer ${star <= rating ? "text-[#C76E77]" : "text-gray-400"}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
          {errors.rating && <p className="text-red-500 mt-1">{errors.rating}</p>}
        </div>

        {/* Form Fields */}
        <div className="mt-8 flex flex-col items-center space-y-6">
          {notebooks.map(({ color, label, value, setValue }) => (
            <div key={label} className="w-full max-w-md">
              <label className="text-lg font-semibold text-[#042405]">{label}</label>
              <input
                type={label === "Price" ? "number" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                className={`w-full p-3 mt-2 border border-black rounded-md ${color} text-[#042405] focus:outline-none focus:ring-2 focus:ring-[#52796F]`}
              />
              {errors[label.toLowerCase()] && (
                <p className="text-red-500 mt-1">{errors[label.toLowerCase()]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center text-black p-5 text-center">
          {/* Buttons */}
          <div className="flex justify-between w-full max-w-md mt-10">
            <button
              type="submit"
              className="w-48 h-12 bg-[#FFF] text-[#042405] font-bold text-lg shadow-md rounded-md border border-black"
            >
              Update Book
            </button>
            <Link href="/bookshelf">
              <button
                type="button"
                className="w-48 h-12 bg-[#C76E77] text-[#FFF] font-bold text-lg shadow-md rounded-md border border-black"
              >
                Cancel
              </button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

