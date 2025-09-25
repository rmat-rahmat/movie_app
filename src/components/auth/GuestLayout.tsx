"use client";

import { useEffect, useState } from "react";
import Footer from "../layout/Footer";
import SideBar from "../layout/SideBar";
import Logo from "../layout/Logo";
import MenuToggle from "../layout/MenuToggle";
import NavSearch from "../layout/NavSearch";
import NavActions from "../layout/NavActions";
import NavigationBar from "../layout/NavigationBar";
import BottomTabBar from "../layout/BottomTabBar";
import { FiHome, FiLogIn, FiSearch } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { SearchInput } from "../search";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation('common');
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileShow, setMobileShow] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 0);
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const bottomTabItems = [
        {
            href: "/",
            icon: <FiHome className="h-6 w-6" />,
            label: t('navigation.home')
        },
        {
            href: "/auth/login",
            icon: <FiLogIn className="h-6 w-6" />,
            label: t('navigation.login')
        }
    ];

    return (
        <div className="max-w-[100vw] overflow-x-hidden">
            <div className="min-h-screen lg:pb-0 pb-20 flex flex-col">
                <NavigationBar scrolled={scrolled}>
                    {/* Logo */}
                    <div className="flex items-center">
                        <MenuToggle onToggle={() => setMenuOpen(!menuOpen)} />
                        <Logo />
                    </div>

                    {/* Search Bar (hidden on mobile) */}
                    {/* <NavSearch showOnMobile={mobileShow} hide={() => setMobileShow(false)} /> */}
                    <button
                        className={`z-100 flex items-center justify-center p-2 rounded text-gray-200 `}
                        onClick={() => setMobileShow(!mobileShow)}
                        aria-label={t('navigation.openMenu')}
                    >
                        <FiSearch size={28} />
                    </button>
                    {/* Actions */}
                    <NavActions type="guest" />
                </NavigationBar>
                <div className="flex">
                    <SideBar show={menuOpen} hide={() => setMenuOpen(false)} />
                    <div
                        className={`flex-1 pt-16 w-[100vw] ${menuOpen ? 'lg:w-[85vw]' : 'lg:w-[100vw]'} transition-width duration-300 ease-in overflow-x-hidden`}
                        style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
                    >
                        {children}
                    </div>
                </div>

                <Footer />

                {/* Bottom Tab Bar for Mobile */}
                <BottomTabBar
                    items={bottomTabItems}
                    className="fixed bottom-0 left-0 w-[100vw] bg-black/90 border-t border-[#f69c05] flex lg:hidden z-50"
                />
            </div>
        </div>
    );
}

