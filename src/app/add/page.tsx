"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useBooks } from "../../lib/bookContext"
import { useToast } from "../../lib/toastContext"
import Link from "next/link"

export default function AddBook() {
  const router = useRouter()
  const { addBook } = useBooks()
  const { showToast } = useToast()

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [genre, setGenre] = useState("")
  const [price, setPrice] = useState("")
  const [rating, setRating] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      addBook({
        title,
        author,
        genre,
        price: Number.parseFloat(price),
        rating,
      })

      showToast(`"${title}" has been added to your bookshelf`, "success")
      router.push("/bookshelf")
    }
  }

  return (
    <div className="w-full items-center bg-[#E1A591] text-[#042405] p-0 text-center min-h-screen">
      <h1 className="text-3xl font-bold bg-[#52796F] p-10 rounded-md shadow-md text-center w-full">Add new book</h1>

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

        <div className="flex flex-wrap justify-center mt-10">
          {notebooks.map((notebook, index) => (
            <div key={index} className="m-6 min-w-[10em] max-w-[25%]">
              <div
                className={`relative h-64 w-44 rounded-lg shadow-lg transform transition-transform hover:-rotate-6 ${notebook.color}`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  {notebook.label}
                </div>
                <div className="absolute inset-0 bg-white rounded-lg opacity-10"></div>
              </div>
              <h4 className="mt-4 text-lg font-semibold"></h4>
              {/* Input Field */}
              <input
                type="text"
                value={notebook.value}
                onChange={(e) => notebook.setValue(e.target.value)}
                placeholder={`Enter ${notebook.label.toLowerCase()}`}
                className={`mt-3 w-40 p-1 border ${errors[notebook.label.toLowerCase()] ? "border-red-500" : "border-[#2D2D2D]"} rounded-md text-center text-[#2D2D2D] outline-none focus:ring-2 focus:ring-[#5F7764]`}
              />
              {errors[notebook.label.toLowerCase()] && (
                <p className="text-red-500 text-sm mt-1">{errors[notebook.label.toLowerCase()]}</p>
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
              Save book
            </button>
            <Link href="/">
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

