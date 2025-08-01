import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import SideBar from "./SideBar";
import Link from "next/link";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 0);
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="flex">
            <div className="h-screen md:w-64 w-0">
                <SideBar show={menuOpen} />
            </div>

            <div className="w-full md:w-[calc(100vw-16rem)] min-h-screen md:pb-0 pb-20">
                <button
                    className="md:hidden absolute top-4 right-4 z-100 flex items-center justify-center p-2 rounded text-gray-200"
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
                    className={`w-full md:w-[calc(100vw-16rem)] flex items-center justify-between py-4 px-4 fixed top-0 left-0 md:left-auto md:right-0 z-50 transition-colors duration-300 
                    ${scrolled ? "bg-gradient-to-b from-black  to-black/30" : "bg-gradient-to-b from-black via-black to-transparent"}
                  `}
                >
                    {/* Logo */}
                    <div className="flex md:hidden items-center">
                        <Image src="/next.svg" alt="Logo" width={40} height={40} />
                        <span className="font-bold text-lg text-white">Seefu TV</span>
                    </div>

                    {/* Search Bar (hidden on mobile) */}
                    <form
                        className=" md:flex items-center mx-6 flex-1 max-w-md hover:shadow-green-500 hover:shadow-xs rounded-full"
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
                            className="w-[60%] md:w-full px-3 py-2 bg-gray-100 bg-transparent text-gray-900 text-white md:rounded-l-full outline-none focus:shadow-green-500 focus:shadow-[0px_1px_0px_0px] "
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 bg-transparent text-gray-900 text-white md:rounded-r-full hover:shadow-[0px_0px_0px_1px] shadow-green-500 rounded-l-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>
                    <ul className="hidden md:flex gap-1 items-center">
                        <li>
                            <Link href="/?" className="text-gray-200 hover:underline">
                                <p className="flex items-center rounded-full block p-2 mb-2 shadow-[0px_0px_10px_1px] shadow-green-500/50">
                                    <svg className="h-5 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <rect x="3" y="7" width="13" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <rect x="16" y="9" width="5" height="6" rx="1" strokeLinecap="round" strokeLinejoin="round" />

                                    </svg>
                                    Upload
                                </p>
                            </Link>
                        </li>
                        <li>
                            <Link href="/auth/login" className="text-gray-200 hover:underline ">
                                <p className="flex items-center rounded-full block p-2 mb-2 shadow-[0px_0px_10px_1px] shadow-green-500/50">
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Sign In/Up
                                </p>
                            </Link>
                        </li>
                    </ul>
                </nav>
                {children}
                <Footer />

                {/* Bottom Tab Bar for Mobile */}
                <nav className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-green-500/30 flex md:hidden z-50">
                    <Link href="/" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-green-400">
                        <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs">Home</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-green-400">
                        <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 8l6 4-6 4V8z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs">Short</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-green-400 hover:text-green-500">
                        <svg className="h-8 w-8 mb-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <rect x="3" y="7" width="13" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="16" y="9" width="5" height="6" rx="1" strokeLinecap="round" strokeLinejoin="round" />

                        </svg>
                        <span className="text-xs">Upload</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-green-400">
                        <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="4" y="4" width="16" height="16" rx="4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs">Subscribe</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-green-400">
                        <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs">Profile</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}

