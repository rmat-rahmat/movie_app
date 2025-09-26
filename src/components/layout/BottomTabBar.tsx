"use client";

import Link from "next/link";
import { FiHome, FiLogIn, FiUpload } from "react-icons/fi";
import Image from "next/image";
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';


interface BottomTabItem {
  href: string;
  icon: React.ReactNode | null;
  label: string;
  active?: boolean;
  highlight?: boolean;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
  avatarUrl?: string;
  displayName?: string;
  initials?: string;
  className?: string;
}

export default function BottomTabBar({ 
  items, 
  avatarUrl, 
  displayName, 
  initials, 
  className = "fixed bottom-0 left-0 w-[100vw] bg-black/90 border-t border-[#fbb033] flex lg:hidden z-50" 
}: BottomTabBarProps) {
  const { t } = useTranslation('common');
    const pathname = usePathname();

  return (
    <nav className={className}>
      {items.map((item, index) => (
        <Link 
          key={index}
          href={item.href} 
          className={`flex-1 flex flex-col items-center py-2 text-gray-300 hover:text-[#fbb033] transform transition-transform duration-200 hover:scale-105 ${
            item.active ? 'text-[#fbb033]' : ''
          }`}
        >
          {/* Special handling for profile tab with avatar */}
          {(item.href === '/profile'||item.href === '/profile/') && (avatarUrl || initials) ? (
            <>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName || 'User'}
                  width={28}
                  height={28}
                  className={`rounded-full w-7 h-7 mb-1 object-cover ${item.highlight ? 'ring-2 ring-[#fbb033]' : ''} `}
                />
              ) : (
                <div className="h-6 w-6 mb-1 rounded-full bg-[#fbb033] flex items-center justify-center font-semibold text-sm">
                  {initials}
                </div>
              )}
              <span className="text-xs">{item.label}</span>
            </>
          ) : item.icon ? (
            <>
              {item.highlight ? (
                <div className="h-6 w-6 mb-1 flex items-center justify-center text-[#fbb033]">
                  {item.icon}
                </div>
              ) : (
                <div className="h-6 w-6 mb-1 flex items-center justify-center">
                  {item.icon}
                </div>
              )}
              <span className="text-xs">{item.label}</span>
            </>
          ) : (
            <span className="text-xs">{item.label}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}