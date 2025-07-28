import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import SideBar from "./SideBar";
import Link from "next/link";


export default function GuestLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [scrolled, setScrolled] = useState(false);
    return (
        <div className="flex">
            <div className="h-screen md:w-64 w-0">
                <SideBar show={menuOpen} />
            </div>

            <div className="w-full md:w-[calc(100vw-16rem)] min-h-screen">
                <button
                    className="md:hidden absolute top-4 right-4 z-100 flex items-center justify-center p-2 rounded text-gray-700 dark:text-gray-200"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Open menu"
                >
                    <svg width={28} height={28} fill="none" viewBox="0 0 24 24">
                        <rect y="5" width="24" height="2" rx="1" fill="currentColor" />
                        <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
                        <rect y="17" width="24" height="2" rx="1" fill="currentColor" />
                    </svg>
                </button>

                <nav
                    className={`w-full flex items-center justify-between py-4 px-4 sm:px-8 fixed top-0 left-0 z-50 transition-colors duration-300 
                    ${scrolled ? "bg-gradient-to-b from-black  to-black/30" : "bg-gradient-to-b from-black via-black to-transparent"}
                  `}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Image src="/next.svg" alt="Logo" width={40} height={40} />
                        <span className="font-bold text-lg text-gray-800 dark:text-white">Seefu TV</span>
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
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-transparent text-gray-900 dark:text-white rounded-l-full outline-none focus:shadow-green-500 focus:shadow-[0px_1px_0px_0px] "
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 bg-transparent text-gray-900 dark:text-white rounded-r-full hover:shadow-[0px_0px_0px_1px] shadow-green-500 rounded-l-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>
                    <ul className="hidden md:flex gap-8 items-center">
                        <li>
                            <Link href="/" className="text-gray-700 dark:text-gray-200 hover:underline ">
                                <p className="flex items-center rounded-full block p-2 mb-2 shadow-[0px_0px_10px_1px] shadow-green-500/50">
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Sign In/Up
                                </p></Link>
                        </li>
                    </ul>
                </nav>
                {children}
                <Footer />
            </div>
            {/* <Footer /> */}
        </div>
    );
}

