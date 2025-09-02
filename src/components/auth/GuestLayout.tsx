"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SearchInput } from '@/components/search';
import Footer from "../layout/Footer";
import SideBar from "../layout/SideBar";
import Link from "next/link";
import { FiUpload, FiUser, FiHome, FiVideo, FiMenu, FiLogIn, FiSearch } from "react-icons/fi";
import { useTranslation } from 'react-i18next';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation('common');
    const [menuOpen, setMenuOpen] = useState(false);
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
                        <Image src="/logo_dark.svg" className="mx-2" alt="Logo" width={40} height={40} />
                        <span className="font-bold text-lg lg:text-3xl text-white">{t('navigation.brand')}</span>
                    </div>

                    {/* Search Bar (hidden on mobile) */}
                    <div className="hidden lg:block mx-6 flex-1 max-w-md">
                        <SearchInput placeholder={t('common.searchPlaceholder')} />
                    </div>
                    <ul className="hidden lg:flex gap-1 items-center">
                        <li>
                            <Link href="/?" className="text-gray-200 hover:underline">
                                <p className="flex items-center rounded-lg block py-2 px-4 mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#f69c05]">
                                    <FiUpload className="h-5 w-6 mb-1" />
                                    {t('navigation.upload')}
                                </p>
                            </Link>
                        </li>
                        <li>
                            <Link href="/auth/login" className="text-gray-200 hover:underline ">
                                <p className="flex items-center rounded-lg block py-2 px-4  mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#f69c05]">
                                    <FiUser className="h-5 w-5 mr-2" />
                                    {t('navigation.login')}
                                </p>
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
                <nav className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-[#f69c05] flex lg:hidden z-50">
                    <Link href="/" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#f69c05]">
                        <FiHome className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.home')}</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#f69c05]">
                        <FiVideo className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.movies')}</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-[#f69c05] hover:text-[#f69c05]">
                        <FiUpload className="h-8 w-8 mb-1" />
                        <span className="text-xs">{t('navigation.upload')}</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#f69c05]">
                        <FiLogIn className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.login')}</span>
                    </Link>
                    <Link href="/?" className="flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#f69c05]">
                        <FiUser className="h-6 w-6 mb-1" />
                        <span className="text-xs">{t('navigation.profile')}</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}

