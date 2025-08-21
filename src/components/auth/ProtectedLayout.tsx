import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "../layout/Footer";
import SideBar from "../layout/SideBar";
import Link from "next/link";
import { FiUpload, FiUser, FiHome, FiVideo, FiMenu, FiLogIn, FiSearch } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const { user } = useAuthStore();

    // Derive display name and avatar
    // Assumption: user may have properties like nickname, name, email, avatar, avatarUrl, photoUrl or picture.
    const displayName = (user && (user.nickname || user.name || (user.email && user.email.split('@')[0]))) || 'User';
    const initials = displayName
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const avatarRaw = user && (user.avatar || user.avatarUrl || user.photoUrl || user.picture || null);
    // Only accept string avatar URLs for next/image. If not a string, fall back to initials avatar.
    const avatarUrl = typeof avatarRaw === 'string' ? avatarRaw : null;

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

            <div className="w-full md:w-[calc(100vw-16rem)] min-h-screen md:pb-0 pb-20 flex flex-col">
                <button
                    className="md:hidden fixed top-4 right-4 z-100 flex items-center justify-center p-2 rounded text-gray-200"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Open menu"
                >
                    <FiMenu size={28} />
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
                        className=" md:flex items-center mx-6 flex-1 max-w-md hover:shadow-[#e50914] hover:shadow-xs rounded-full"
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
                            className="w-[60%] md:w-full px-3 py-2 bg-gray-100 bg-transparent text-gray-900 text-white md:rounded-l-full outline-none focus:shadow-[#e50914] focus:shadow-[0px_1px_0px_0px] "
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 bg-transparent text-gray-900 text-white md:rounded-r-full hover:shadow-[0px_0px_0px_1px] shadow-[#e50914] rounded-l-full"
                        >
                            <FiSearch className="h-5 w-5" />
                        </button>
                    </form>
                    <ul className="hidden md:flex gap-1 items-center">
                        <li>
                            <Link href="/?" className="text-gray-200 hover:underline">
                                    <p className="flex items-center rounded-lg block py-2 px-4 mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#e50914] transform transition-transform duration-200 hover:scale-105">
                                    <FiUpload className="h-5 w-6 mb-1" />
                                    Upload
                                </p>
                            </Link>
                        </li>
                        <li>
                            <Link href="/profile" className="text-gray-200 ">
                                <div className="flex items-center py-2 px-4 mb-2 transform transition-transform duration-200 hover:scale-105">
                                    {/* Avatar on desktop: image when available, otherwise initials */}
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt={displayName} width={28} height={28} className="rounded-full mr-2 object-cover" />
                                    ) : (
                                        <div className="h-7 w-7 mr-2 rounded-full bg-[#e50914] text-black flex items-center justify-center font-semibold text-sm">
                                            {initials}
                                        </div>
                                    )}
                                    <span className="hidden md:inline">Hi, {displayName.split(' ')[0]}</span>
                                </div>
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="flex-1 pt-16">
                    {children}
                </div>
                <Footer />

                {/* Bottom Tab Bar for Mobile */}
                <nav className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-[#e50914] flex md:hidden z-50">
                    <Link href="/" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#e50914] transform transition-transform duration-200 hover:scale-105">
                        <FiHome className="h-6 w-6 mb-1" />
                        <span className="text-xs">Home</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#e50914] transform transition-transform duration-200 hover:scale-105">
                        <FiVideo className="h-6 w-6 mb-1" />
                        <span className="text-xs">Short</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-[#e50914] hover:text-[#e50914] transform transition-transform duration-200 hover:scale-105">
                        <FiUpload className="h-8 w-8 mb-1" />
                        <span className="text-xs">Upload</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#e50914] transform transition-transform duration-200 hover:scale-105">
                        <FiLogIn className="h-6 w-6 mb-1" />
                        <span className="text-xs">Subscribe</span>
                    </Link>
                    <Link href="/profile" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#e50914] transform transition-transform duration-200 hover:scale-105">
                        {/* Greeting */}

                        {/* Avatar: image when available, otherwise letter avatar from initials */}
                        {avatarUrl ? (
                            // next/image prefers width/height numbers
                            <Image
                                src={avatarUrl}
                                alt={displayName}
                                width={28}
                                height={28}
                                className="rounded-full mb-1 object-cover"
                            />
                        ) : (
                            <div className="h-6 w-6 mb-1 rounded-full bg-[#e50914] flex items-center justify-center font-semibold text-sm">
                                {initials}
                            </div>

                        )}
                        <span className="text-xs">{displayName}</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}

