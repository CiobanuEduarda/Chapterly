"use client"
import { useState } from "react";


export default function DeleteBookPage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");


 
  return (
    <div className="flex h-screen w-full bg-[#89A593] justify-center items-center">
      {/* Delete Book Section */}
      <div className="flex flex-col w-2/3 bg-[#E1A591] p-10 rounded-lg shadow-lg">
        
        {/* Header */}
        <div className="bg-[#52796F] p-6 rounded-md shadow-md flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#042405]">Delete book</h1>
         
        </div>

        {/* Input Fields */}
        <div className="mt-8 flex flex-col space-y-6">
          {/* Title Input */}
          <div>
            <label className="text-lg font-semibold text-[#042405]">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              className="w-full p-3 mt-2 border border-black rounded-md bg-[#C76E77] text-[#042405] focus:outline-none focus:ring-2 focus:ring-[#52796F]"
            />
          </div>

          {/* Author Input */}
          <div>
            <label className="text-lg font-semibold text-[#042405]">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author's name"
              className="w-full p-3 mt-2 border border-black rounded-md bg-[#C76E77] text-[#042405] focus:outline-none focus:ring-2 focus:ring-[#52796F]"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex justify-center space-x-6">
          <button
           
            className="px-6 py-3 bg-white text-[#042405] font-bold rounded-md shadow-md border border-black hover:bg-gray-200"
          >
            Delete 
          </button>
          <button
            onClick={() => {
              setTitle("");
              setAuthor("");
            }}
            className="px-6 py-3 bg-[#C76E77] text-white font-bold rounded-md shadow-md border border-black hover:bg-[#a35d65]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
