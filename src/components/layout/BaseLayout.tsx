"use client";

import { useEffect, useState, ReactNode } from "react";
import Footer from './Footer';
import SideBar from './SideBar';
import Logo from './Logo';
import MenuToggle from './MenuToggle';
import NavSearch from './NavSearch';
import NavActions from './NavActions';
import NavigationBar from './NavigationBar';
import BottomTabBar from './BottomTabBar';
import { FiHome, FiLogIn, FiPlusCircle, FiUpload, FiUser } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { type User } from '../../store/authStore';
import { usePathname } from "next/navigation";

interface BaseLayoutProps {
  children: ReactNode;
  type: 'guest' | 'protected';
  user?: User|null;
  avatarUrl?: string;
  displayName?: string;
  initials?: string;
}

interface TabItem {
  href: string;
  icon: React.ReactNode | null;
  label: string;
  active?: boolean;
  highlight?: boolean;
}

export default function BaseLayout({ 
  children, 
  type, 
  user, 
  avatarUrl, 
  displayName = 'User', 
  initials 
}: BaseLayoutProps) {
  const { t } = useTranslation('common');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Create bottom tab items based on type
  const getBottomTabItems = (): TabItem[] => {
    const baseItems: TabItem[] = [
      {
        href: "/",
        icon: <FiHome className="h-6 w-6" />,
        highlight: pathname === '/',
        label: t('navigation.home')
      }
    ];

    if (type === 'guest') {
      return [
        ...baseItems,
        {
          href: "/profileempty",
          icon: <FiUser className="h-6 w-6" />,
          highlight: pathname === '/profileempty' || pathname === '/profileempty/' ,
          label: t('navigation.profile')
        }
      ];
    }

    // For protected layout
    const protectedItems: TabItem[] = [...baseItems];
    
    if (user && user.userType == 1) {
      protectedItems.push({
        href: "/upload",
        icon: <FiPlusCircle className="h-6 w-6" />,
        label: t('navigation.upload'),
        highlight: pathname === '/upload'|| (pathname?.startsWith?.('/upload/') ?? false),
        active: true
      });
    }

    protectedItems.push({
      href: "/profile",
      icon: null, // Will be handled specially in BottomTabBar
      highlight: pathname === '/profile' || (pathname?.startsWith?.('/profile/') ?? false),
      label: t('navigation.profile') //  || displayName.split(' ')[0]
    });

    return protectedItems;
  };

  const bottomTabItems = getBottomTabItems();
  const borderColor = type === 'guest' ? 'border-[#f69c05]' : 'border-[#fbb033]';
  const navSearchClassName = type === 'guest' ? "hidden lg:block mx-6 flex-1 max-w-md" : "hidden md:block mx-6 flex-1 max-w-md";
  const tabBarClassName = type === 'guest' ? "md:hidden" : "md:hidden";

  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      <div className="min-h-screen lg:pb-0 pb-20 flex flex-col">
        <NavigationBar scrolled={scrolled}>
          {/* Logo */}
          <div className="flex items-center">
            <MenuToggle className="hidden md:block" onToggle={() => setMenuOpen(!menuOpen)} />
            <Logo />
          </div>

          {/* Search Bar */}
          <NavSearch className={navSearchClassName} />
          
          {/* Actions */}
          <NavActions 
            type={type} 
            user={user} 
            avatarUrl={avatarUrl} 
            displayName={displayName} 
            initials={initials}
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
          className={`fixed bottom-0 left-0 w-[100vw] bg-black/90 ${borderColor} border-t flex ${tabBarClassName} z-50`}
        />
      </div>
    </div>
  );
}