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
import { FiHome, FiPlusCircle, FiUpload } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "@/store/authStore";
import { getImageById } from "@/lib/uploadAPI";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
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
    
    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 0);
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // when user changes, update avatar URL
    useEffect(() => {
        const fetchAvatar = async () => {
            if (user) {
                let avatar = user.avatar || '';
                if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data')) {
                    // fetch full URL from upload API
                    const imageUrl = await getImageById(user.avatar, '360')
                    avatar = imageUrl.url || '';
                }
                setAvatarUrl(avatar);
            } else {
                setAvatarUrl('');
            }
        };
        fetchAvatar();
    }, [user]);

    // Bottom tab items for mobile
    const bottomTabItems = [
        {
            href: "/",
            icon: <FiHome className="h-6 w-6" />,
            label: t('navigation.home')
        },
        ...(user && user.userType == 1 ? [{
            href: "/upload",
            icon: <FiPlusCircle className="h-8 w-8" />,
            label: t('navigation.upload'),
            highlight: true,
            active: true
        }] : []),
        {
            href: "/profile",
            icon: null, // Will be handled specially in BottomTabBar
            label: t('profile.greeting', { name: displayName.split(' ')[0] })
        }
    ];

    return (
         <div className="max-w-[100vw] overflow-x-hidden">
            <div className="w-[100vw] min-h-screen lg:pb-0 pb-20 flex flex-col">
                <NavigationBar scrolled={scrolled}>
                    {/* Logo */}
                    <div className="flex items-center">
                        <MenuToggle onToggle={() => setMenuOpen(!menuOpen)} />
                        <Logo />
                    </div>

                    {/* Search Bar (hidden on mobile) */}
                    <NavSearch className="hidden md:block mx-6 flex-1 max-w-md" />
                    
                    {/* Actions */}
                    <NavActions 
                        type="protected" 
                        user={user} 
                        avatarUrl={avatarUrl} 
                        displayName={displayName} 
                        initials={initials}
                        className="hidden md:flex gap-1 items-center"
                    />
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
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    initials={initials}
                    className="fixed bottom-0 left-0 w-[100vw] bg-black/90 border-t border-[#fbb033] flex md:hidden z-50"
                />
            </div>
        </div>
    );
}

