"use client"; // Add this line to make it a client component

import Link from "next/link"; // Import Link component from Next.js
import { useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if running in the browser and if user is authenticated
    if (typeof window !== 'undefined') {
      const authenticated = localStorage.getItem('isAuthenticated') === 'true';
      if (!authenticated) {
        router.push('/login');
      }
    }
  }, [router]);

  // Optional: You might want to return null or a loading spinner while redirecting
  // For now, it will render the existing HomePage content if authenticated,
  // or briefly before redirecting if not.
  // if (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') !== 'true') {
  //   return null; // Or a loading indicator
  // }

  return (
    <div className="flex h-screen w-full bg-[#89A593]"> {/* Main container with full height and background color */}
      {/* Left Section */}
      <div className="flex flex-col w-3/4 h-full bg-[#E1A591] p-10"> {/* Left section covering 3/4th width */}
        {/* Header */}
        <div className="bg-[#A1AD92] p-8 rounded-md shadow-md text-center"> {/* Header section with background, padding, and shadow */}
          <h1 className="text-3xl font-bold text-[#042405] ">Welcome to Chapterly</h1> {/* Main title with underline */}
          <p className="text-lg text-black mt-2">Meet your favourite book and manage your reading life.</p> {/* Subtitle */}
        </div>
        
        {/* Quote */}
        <div className="mt-6"> {/* Quote section with top margin */}
          <h2 className="text-xl font-bold text-[#52796F]">Quote of the day:</h2> {/* Quote title */}
          <p className="text-lg text-black font-semibold mt-2"> {/* Quote text with styling */}
            "A reader lives a thousand lives before he dies. The man who never reads lives only one." – George R.R. Martin
          </p>
        </div>

        {/* Reading Progress */}
        <div className="mt-6"> {/* Reading progress section */}
          <h2 className="text-xl font-bold text-[#C76E77] text-center">Reading progress</h2> {/* Reading progress title */}
          <div className="bg-[#C76E77] p-2 rounded-full w-[300px] mt-2 relative mx-auto"> {/* Progress bar container */}
            <span className="text-sm text-[#042405] font-bold absolute left-5 top-1.5">March</span> {/* Month label on the left */}
            <div className="h-4 bg-[#6E8876] w-[48%] rounded-full ml-2"></div> {/* Progress bar filling */}
            <span className="text-sm text-black font-bold absolute right-2 top-8">14/30</span> {/* Reading progress count on the right */}
          </div>
        </div>

        {/* Recent Reads */}
        <div className="mt-6"> {/* Recent books section */}
          <h2 className="text-xl font-bold text-[#52796F]">Here are your recent reads:</h2> {/* Recent reads title */}
          <div className="flex space-x-4 mt-4"> {/* Flex container for book covers */}
            <div className="text-center"> {/* First book */}
              <img src="/book1.png" alt="Book 1" className="w-24 h-36 rounded-md" /> {/* Book cover image */}
              <p className="text-lg mt-1">★★★★☆</p> {/* Book rating */}
            </div>
            <div className="textcenter"> {/* Second book */}
              <img src="/book2.png" alt="Book 2" className="w-24 h-36 rounded-md" /> {/* Book cover image */}
              <p className="text-lg mt-1">★★★☆☆</p> {/* Book rating */}
            </div>
            <div className="text-center"> {/* Third book */}
              <img src="/book3.png" alt="Book 3" className="w-24 h-36 rounded-md" /> {/* Book cover image */}
              <p className="text-lg mt-1">★★★☆☆</p> {/* Book rating */}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col w-1/4 h-full bg-[#52796F] p-10 justify-center items-center space-y-6"> {/* Right section for buttons */}
        <Link href="bookshelf">
          <button className="w-48 h-12 bg-[#C76E77] text-[#042405] font-bold text-lg shadow-md rounded-md border border-black">Book Shelf</button>
        </Link> {/* Book Shelf button */}
        <Link href="add">
           <button className="w-48 h-12 bg-[#C76E77] text-[#042405] font-bold text-lg shadow-md rounded-md border border-black">Add</button>
           </Link> {/* Add button */}
        <Link href="chart">
        <button className="w-48 h-12 bg-[#C76E77] text-[#042405] font-bold text-lg shadow-md rounded-md border border-black">Analytics</button>
        </Link> {/* chart button */}
        <Link href="files">
        <button className="w-48 h-12 bg-[#C76E77] text-[#042405] font-bold text-lg shadow-md rounded-md border border-black">File Management</button>
        </Link> {/* chart button */}

          
       
      </div>
      {/* Yellow Book Illustration */}
    <img 
        src="/yellow-book.png" 
        alt="Yellow Book" 
        className="absolute bottom-0 right-40 w-80 opacity-100"
    />

    <img 
        src="/blue-book.png" 
        alt="Blue Book" 
        className="absolute bottom-0 right-40 w-80 opacity-100"
    />
    </div>
  );
}
