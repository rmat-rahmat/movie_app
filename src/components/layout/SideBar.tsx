import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use, useEffect, useState } from 'react';
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
  
  useEffect(() => {
    setOpenDropdown(null); // Reset dropdown on pathname change
    // This effect runs on mount and whenever the pathname changes
    console.log("Current Pathname:", pathname);
  }, [pathname]);

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

  // Create menu based on authentication status (labels come from translations)
  const getMenu = () => {
    const baseMenu = [
      { href: "/", label: t('navigation.home'), icon: <FiHome className="h-5 w-5 mr-2" /> },
      { href: "/about", label: t('navigation.about'), icon: <FiInfo className="h-5 w-5 mr-2" /> },
      {
        label: t('navigation.categories') || 'Categories',
        icon: <FiGrid className="h-5 w-5 mr-2" />,
        subMenu: [
          { href: "/movies", label: t('navigation.movies'), icon: <FiFilm className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.sports') || 'Sports', icon: <FiSmile className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.tv') || 'TV', icon: <FiTv className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.dramas') || 'Dramas', icon: <FiGrid className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.music') || 'My Music', icon: <FiMusic className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.entertainment') || 'Entertainment', icon: <FiSmile className="h-5 w-5 mr-2" /> },
          { href: "/?", label: t('navigation.technology') || 'Technology', icon: <FiCpu className="h-5 w-5 mr-2" /> },
        ]
      },
      { href: "/?", label: t('navigation.contact') || 'Contact', icon: <FiMail className="h-5 w-5 mr-2" /> },
    ];

    if (isAuthenticated) {
      baseMenu.splice(2, 0, { href: "/profile", label: t('navigation.profile'), icon: <FiUser className="h-5 w-5 mr-2" /> });
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
    <div  className={`pt-20 bg-black/80 fixed lg:relative h-screen text-white py-6 z-40  ${show ? 'w-[70vw] lg:w-[20vw]' : 'w-0'} transition-width duration-300 ease-in-out`}>
    <div className={`fixed  px-4 h-full ${show ? 'w-[70vw] lg:w-[15vw]' : 'w-0 hidden'} transition-width duration-300 ease-in-out`}>
      {/* <h1 className="text-3xl font-bold mt-2 mb-10">OTalk.TV</h1> */}
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
                  className={`flex w-full cursor-pointer items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033]
                    ${isOpen ? "bg-gradient-to-l from-[#fbb033] to-transparent font-bold" : ""}
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
                          <p className={`flex items-center block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033] 
                            ${pathname === href ? "bg-gradient-to-l from-[#fbb033] to-transparent font-bold" : ""}
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
                <p className={`flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033]
                  ${pathname === href ? "bg-gradient-to-l from-[#fbb033] to-transparent font-bold" : ""}
                `}>
                  {icon}
                  {label}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="absolute bottom-40 md:bottom-30 left-4 w-full">
        {isAuthenticated ? (
          <div className="space-y-2">
            {/* <p className="text-gray-400 text-sm">Hi, {user?.nickname || user?.email || 'User'}</p> */}
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md block p-2 w-full hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033] bg-transparent border-none text-white cursor-pointer"
            >
              <FiLogOut className="h-5 w-5 mr-2" />
              {t('navigation.logout')}
            </button>
          </div>
        ) : (
          <Link href={'/auth/login'}>
            <p className="flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033]">
              <FiLogIn className="h-5 w-5 mr-2" />
              {t('navigation.login')}
            </p>
          </Link>
        )}
      </div>
    </div>
    </div>
  );
};

export default SideBar;

