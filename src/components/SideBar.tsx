import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiInfo,
  FiFilm,
  FiLayers,
  FiGrid,
  FiTv,
  FiMusic,
  FiSmile,
  FiCpu,
  FiBook,
  FiMail,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiLogIn,
  FiLogOut
} from 'react-icons/fi';

const SideBar = ({ show }: { show: boolean }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { t } = useTranslation('common');

  const menu = [
    { href: "/", label: t('navigation.home'), icon: <FiHome className="h-5 w-5 mr-2" /> },
    { href: "/about", label: t('navigation.about'), icon: <FiInfo className="h-5 w-5 mr-2" /> },
    { href: "/profile", label: t('navigation.profile'), icon: <FiUser className="h-5 w-5 mr-2" /> },
    {
      label: "Categories",
      icon: <FiGrid className="h-5 w-5 mr-2" />,
      subMenu: [
        { href: "/movies", label: t('navigation.movies'), icon: <FiFilm className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "Sports", icon: <FiSmile className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "TV", icon: <FiTv className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "Dramas", icon: <FiGrid className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "My Music", icon: <FiMusic className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "Entertainment", icon: <FiSmile className="h-5 w-5 mr-2" /> },
        { href: "/?", label: "Technology", icon: <FiCpu className="h-5 w-5 mr-2" /> },
      ]
    },
    { href: "/?", label: "Contact", icon: <FiMail className="h-5 w-5 mr-2" /> },
  ];
  const { isAuthenticated, user, logout } = useAuthStore();

  // Create menu based on authentication status
  const getMenu = () => {
    const baseMenu = [
      { href: "/", label: "Home", icon: <FiHome className="h-5 w-5 mr-2" /> },
      { href: "/about", label: "About", icon: <FiInfo className="h-5 w-5 mr-2" /> },
      {
        label: "Categories",
        icon: <FiGrid className="h-5 w-5 mr-2" />,
        subMenu: [
          { href: "/movies", label: "Movies", icon: <FiFilm className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "Sports", icon: <FiSmile className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "TV", icon: <FiTv className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "Dramas", icon: <FiGrid className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "My Music", icon: <FiMusic className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "Entertainment", icon: <FiSmile className="h-5 w-5 mr-2" /> },
          { href: "/?", label: "Technology", icon: <FiCpu className="h-5 w-5 mr-2" /> },
        ]
      },
      { href: "/?", label: "Contact", icon: <FiMail className="h-5 w-5 mr-2" /> },
    ];

    if (isAuthenticated) {
      baseMenu.splice(2, 0, { href: "/profile", label: "Profile", icon: <FiUser className="h-5 w-5 mr-2" /> });
    }

    return baseMenu;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <div className={`fixed top-0 left-0 h-screen w-64 text-white px-4 py-6 shadow-[0px_0px_10px_1px] shadow-[#e50914] z-100 bg-black/90 ${show ? 'block' : 'hidden'} transition-transform duration-300 ease-in-out lg:block`}>
      <h1 className="text-3xl font-bold mt-2 mb-10">Seefu.TV</h1>
      <ul>
        {getMenu().map(({ href, label, icon, subMenu }) => {
          if (subMenu) {
            // Check if any submenu item matches pathname
            const shouldOpen = subMenu.some(item => pathname === item.href);
            const isOpen = openDropdown === label || shouldOpen;
            return (
              <li key={label}>
                <button
                  onClick={() => handleDropdownToggle(label)}
                  className={`flex w-full cursor-pointer items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]
                    ${isOpen ? "bg-gradient-to-l from-[#e50914] to-transparent font-bold" : ""}
                  `}
                >
                  {icon}
                  {label}
                  {isOpen ? <FiChevronUp className="ml-auto" /> : <FiChevronDown className="ml-auto" />}
                </button>
                {isOpen && (
                  <ul className="pl-8">
                    {subMenu.map(({ href, label, icon }) => (
                      <li key={href}>
                        <Link href={href}>
                          <p className={`flex items-center block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914] 
                            ${pathname === href ? "bg-gradient-to-l from-[#e50914] to-transparent font-bold" : ""}
                          `}>
                            {icon}
                            {label}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }
          // Not a submenu
          return (
            <li key={label}>
              <Link href={href}>
                <p className={`flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]
                  ${pathname === href ? "bg-gradient-to-l from-[#e50914] to-transparent font-bold" : ""}
                `}>
                  {icon}
                  {label}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="absolute bottom-6 left-4 w-[calc(100%-2rem)] lg:hidden">
        {isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Hi, {user?.nickname || user?.email || 'User'}</p>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md block p-2 w-full hover:shadow-[0px_0px_10px_1px] shadow-[#e50914] bg-transparent border-none text-white cursor-pointer"
            >
              <FiLogOut className="h-5 w-5 mr-2" />
              {t('navigation.logout')}
            </button>
          </div>
        ) : (
          <Link href={'/auth/login'}>
            <p className="flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]">
              <FiLogIn className="h-5 w-5 mr-2" />
              {t('navigation.login')}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default SideBar;

