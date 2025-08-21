'use client';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiSearch, FiMenu, FiX } from "react-icons/fi"; // Import react-icons
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../i18n/LanguageSwitcher";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t } = useTranslation('common');

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

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
          placeholder={t('common.search')}
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
          <Link href="/" className="text-gray-200 hover:underline">{t('navigation.home')}</Link>
        </li>
        <li>
          <Link href="/movies" className="text-gray-200 hover:underline">{t('navigation.movies')}</Link>
        </li>
        <li>
          <Link href="/about" className="text-gray-200 hover:underline">{t('navigation.about')}</Link>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <Link href="/profile" className="text-gray-200 hover:underline">{t('navigation.profile')}</Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="text-gray-200 hover:underline bg-transparent border-none cursor-pointer"
              >
                {t('navigation.logout')}
              </button>
            </li>
            <li className="text-gray-400 text-sm">
              Hi, {user?.nickname || user?.email || 'User'}
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/auth/login" className="text-gray-200 hover:underline">{t('navigation.login')}</Link>
            </li>
            <li>
              <Link href="/auth/register" className="text-gray-200 hover:underline">{t('navigation.register')}</Link>
            </li>
          </>
        )}
        <li>
          <LanguageSwitcher />
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
                placeholder={t('common.search')}
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
                <Link href="/" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.home')}</Link>
              </li>
              <li>
                <Link href="/movies" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.movies')}</Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.about')}</Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/profile" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.profile')}</Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-200 hover:underline bg-transparent border-none cursor-pointer text-left w-full"
                    >
                      {t('navigation.logout')}
                    </button>
                  </li>
                  <li className="text-gray-400 text-sm">
                    Hi, {user?.nickname || user?.email || 'User'}
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.login')}</Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className="text-gray-200 hover:underline" onClick={() => setMenuOpen(false)}>{t('navigation.register')}</Link>
                  </li>
                </>
              )}
              <li>
                <LanguageSwitcher />
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}