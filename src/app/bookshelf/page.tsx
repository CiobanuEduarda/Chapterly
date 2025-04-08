"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooks } from "../../lib/bookContext"
import { useToast } from "../../lib/toastContext"
import { BookList } from "../../components/BookList"
import { Book } from "../../lib/bookContext"

export default function BookShelf() {
  const router = useRouter()
  const { deleteBook } = useBooks()
  const { showToast } = useToast()
  
  // State for delete confirmation
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false)
  const [bookToDelete, setBookToDelete] = useState<number | null>(null)
  const [bookToDeleteTitle, setBookToDeleteTitle] = useState<string>("")

  // Handle book click - navigate to update page
  const handleBookClick = (book: Book) => {
    router.push(`/update/${book.id}`)
  }

  // Handle delete confirmation
  const confirmDelete = (id: number) => {
    const book = bookToDelete ? { id: bookToDelete, title: bookToDeleteTitle } : null
    if (book) {
      setBookToDelete(id)
      setBookToDeleteTitle(book.title)
      setShowConfirmDelete(true)
    }
  }

  // Handle delete book
  const handleDeleteBook = () => {
    if (bookToDelete !== null) {
      deleteBook(bookToDelete)
      setShowConfirmDelete(false)
      setBookToDelete(null)
      showToast(`"${bookToDeleteTitle}" has been deleted`, "success")
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#89A593] p-8">
      {/* Book List with Endless Scrolling */}
      <BookList onBookClick={handleBookClick} onDeleteClick={confirmDelete} />

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

      {/* Delete Confirmation Modal */}
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
