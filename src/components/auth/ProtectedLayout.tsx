"use client";

import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { SearchInput } from '@/components/search';
import { useTranslation } from 'react-i18next';
import Footer from "../layout/Footer";
import SideBar from "../layout/SideBar";
import Link from "next/link";
import { FiUpload, FiHome, FiVideo, FiMenu, FiLogIn } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = useAuthStore();
    const { t } = useTranslation('common');

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
    // console.log('User:', user);
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

            <div className="w-full min-h-screen lg:pb-0 pb-20 flex flex-col">

                <nav
                    className={`w-full flex items-center justify-between py-4 px-4 fixed top-0 left-0 lg:left-auto lg:right-0 z-50 transition-colors duration-300 
                    ${scrolled ? "bg-gradient-to-b from-black  to-black/30" : "bg-gradient-to-b from-black via-black to-transparent"}
                  `}
                >
                    {/* Logo */}
                    <div className="flex items-center">
                        <button
                            className=" z-100 flex items-center justify-center p-2 rounded text-gray-200"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label={t('navigation.openMenu')}
                        >
                            <FiMenu size={28} />
                        </button>
                        <Link href="/" className="flex items-center gap-2 cursor-pointer">

                            <Image src="/logo_dark.svg" className="mx-2" alt="Logo" width={40} height={40} />
                            <span className="font-bold text-lg lg:text-3xl text-white">{t('navigation.brand')}</span>
                        </Link>
                    </div>

                    {/* Search Bar (hidden on mobile) */}
                    <div className="hidden md:block mx-6 flex-1 max-w-md">
                        <Suspense fallback={<div className="h-10 bg-gray-800 rounded"></div>}>
                            <SearchInput placeholder={t('common.searchPlaceholder')} />
                        </Suspense>
                    </div>
                    <ul className="hidden md:flex gap-1 items-center">
                       {user && user.userType==1 &&  <li>
                            <Link href="/upload" className="text-gray-200 hover:underline">
                                <p className="flex items-center rounded-lg block py-2 px-4 mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                                    <FiUpload className="h-5 w-6 mb-1" />
                                    {t('navigation.upload')}
                                </p>
                            </Link>
                        </li>}
                        <li>
                            <Link href="/profile" className="text-gray-200 ">
                                <div className="flex items-center py-2 px-4 mb-2 transform transition-transform duration-200 hover:scale-105">
                                    {/* Avatar on desktop: image when available, otherwise initials */}
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt={displayName} width={28} height={28} className="rounded-full w-10 h-10 mr-2 object-cover" />
                                    ) : (
                                        <div className="h-7 w-7 mr-2 rounded-full bg-[#fbb033] text-black flex items-center justify-center font-semibold text-sm">
                                            {initials}
                                        </div>
                                    )}
                                    <span className="hidden md:inline">{t('profile.greeting', { name: displayName.split(' ')[0] })}</span>
                                </div>
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="flex">
                    <SideBar show={menuOpen} />
                    <div className={`flex-1 pt-16 w-full ${menuOpen ? 'lg:w-[85vw]' : 'lg:w-full'} transition-width duration-300 ease-in`}>
                        {children}
                    </div>
                </div>
                <Footer />

                {/* Bottom Tab Bar for Mobile */}
                <nav className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-[#fbb033] flex md:hidden z-50">
                    <Link href="/" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                        <FiHome className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.home')}</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                        <FiVideo className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.short')}</span>
                    </Link>
                {user && user.userType==1 && <Link href="/upload" className="flex-1 flex flex-col items-center py-2 text-[#fbb033] hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                    <FiUpload className="h-8 w-8 mb-1" />
                    <span className="text-xs">{t('navigation.upload')}</span>
                </Link>}
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                        <FiLogIn className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.subscribe')}</span>
                    </Link>
                    <Link href="/profile" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105">
                        {/* Greeting */}

                        {/* Avatar: image when available, otherwise letter avatar from initials */}
                        {avatarUrl ? (
                            // next/image prefers width/height numbers
                            <Image
                                src={avatarUrl}
                                alt={displayName}
                                width={28}
                                height={28}
                                className="rounded-full w-7 h-7 mb-1 object-cover"
                            />
                        ) : (
                            <div className="h-6 w-6 mb-1 rounded-full bg-[#fbb033] flex items-center justify-center font-semibold text-sm">
                                {initials}
                            </div>

                        )}
                        <span className="text-xs">{t('profile.greeting', { name: displayName.split(' ')[0] })}</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}

