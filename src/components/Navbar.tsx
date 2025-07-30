'use client';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full flex items-center justify-between py-4 px-4 sm:px-8 fixed top-0 left-0 z-50 transition-colors duration-300 
        ${scrolled ? "bg-gradient-to-b from-black  to-black/30" : "bg-gradient-to-b from-black via-black to-transparent"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/next.svg" alt="Logo" width={40} height={40} />
        <span className="font-bold text-lg text-white">Seefu TV</span>
      </div>

      {/* Search Bar (hidden on mobile) */}
      <form
        className="hidden md:flex items-center mx-6 flex-1 max-w-md hover:shadow-green-500 hover:shadow-xs rounded-full"
        onSubmit={e => {
          e.preventDefault();
          // handle search logic here
        }}
      >
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search movies, series..."
          className="w-full px-3 py-2 bg-transparent text-white rounded-l-full outline-none focus:shadow-green-500 focus:shadow-[0px_1px_0px_0px] "
        />
        <button
          type="submit"
          className="px-3 py-2 bg-transparent text-white rounded-r-full hover:shadow-[0px_0px_0px_1px] shadow-green-500 rounded-l-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
      </form>

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-8 items-center">
        <li>
          <Link href="/" className="text-gray-200 hover:underline">Home</Link>
        </li>
        <li>
          <Link href="/movies" className="text-gray-200 hover:underline">Movies</Link>
        </li>
        <li>
          <Link href="/" className="text-gray-200 hover:underline">Series</Link>
        </li>
        <li>
          <Link href="/" className="text-gray-200 hover:underline">Watchlist</Link>
        </li>
        <li>
          <Link href="/" className="text-gray-200 hover:underline">Profile</Link>
        </li>
      </ul>

      {/* Hamburger Button (mobile only) */}
      <button
        className="md:hidden flex items-center justify-center p-2 rounded text-gray-200"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        <svg width={28} height={28} fill="none" viewBox="0 0 24 24">
          <rect y="5" width="24" height="2" rx="1" fill="currentColor" />
          <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
          <rect y="17" width="24" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-0 right-0 w-3/4 max-w-xs h-full bg-gray-900 shadow-lg flex flex-col p-6 gap-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="self-end mb-4 p-2"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
                <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <form
              className="flex items-center mb-4"
              onSubmit={e => {
                e.preventDefault();
                setMenuOpen(false);
                // handle search logic here
              }}
            >
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-l bg-gray-800 text-white outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                Search
              </button>
            </form>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>Home</Link>
              </li>
              <li>
                <Link href="/movies" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>Movies</Link>
              </li>
              <li>
                <Link href="/series" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>Series</Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>Watchlist</Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>Profile</Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}