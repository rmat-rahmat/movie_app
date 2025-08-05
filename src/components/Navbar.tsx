'use client';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiSearch, FiMenu, FiX } from "react-icons/fi"; // Import react-icons

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
        className="hidden md:flex items-center mx-6 flex-1 max-w-md hover:shadow-[#e50914] hover:shadow-xs rounded-full"
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
          className="w-full px-3 py-2 bg-transparent text-white rounded-l-full outline-none focus:shadow-[#e50914] focus:shadow-[0px_1px_0px_0px] "
        />
        <button
          type="submit"
          className="px-3 py-2 bg-transparent text-white rounded-r-full hover:shadow-[0px_0px_0px_1px] shadow-[#e50914] rounded-l-full"
        >
          <FiSearch className="h-5 w-5" />
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
          <Link href="/series" className="text-gray-200 hover:underline">Series</Link>
        </li>
        <li>
          <Link href="/watchlist" className="text-gray-200 hover:underline">Watchlist</Link>
        </li>
        <li>
          <Link href="/profile" className="text-gray-200 hover:underline">Profile</Link>
        </li>
      </ul>

      {/* Hamburger Button (mobile only) */}
      <button
        className="md:hidden flex items-center justify-center p-2 rounded text-gray-200"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        <FiMenu size={28} />
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
              <FiX size={24} />
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
                <FiSearch className="h-5 w-5" />
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