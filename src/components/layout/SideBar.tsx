import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCachedCategories } from '@/lib/movieApi';
import type { CategoryItem } from '@/types/Dashboard';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiInfo,
  FiGrid,
  FiMail,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiUpload
} from 'react-icons/fi';
import RecursiveMenu, { type MenuItem } from './RecursiveMenu';

const SideBar = ({ show }: { show: boolean }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string[]>([]);
  const [userToggled, setUserToggled] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryItem[] | null>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    setOpenDropdown([]); // Reset dropdown on pathname change
  setUserToggled(false);
    // This effect runs on mount and whenever the pathname changes
    const segments = pathname ? pathname.split("/").filter(item => item) : [];
    setOpenDropdown(segments);
  }, [pathname]);

  useEffect(() => {
    // Load cached categories on client mount
    try {
      const cats = getCachedCategories();
      if (cats && Array.isArray(cats)) setCategories(cats);
    } catch (_e) {
      // ignore
    }
  }, []);

  const { isAuthenticated, logout, user } = useAuthStore();

  // Create menu based on authentication status (labels come from translations)
  const getMenu = () => {
    const baseMenu = [
      { href: "/", label: t('navigation.home'), icon: <FiHome className="h-5 w-5 mr-2" /> },
      { href: "/about", label: t('navigation.about'), icon: <FiInfo className="h-5 w-5 mr-2" /> },
      {
        label: t('navigation.categories') || 'Categories',
        name:"category",
        icon: <FiGrid className="h-5 w-5 mr-2" />,
        subMenu: (categories && categories.length)
          ? categories.map((c) => ({
            href: `/category/${c.id}`, label: c.categoryName || c.categoryAlias || c.id, icon: <FiGrid className="h-5 w-5 mr-2" />,
            name:c.id,
            subMenu: c.children && c.children.length ? c.children.map((sub: CategoryItem) => ({ href: `/category/${sub.id}`, label: sub.categoryName || sub.categoryAlias || sub.id, icon: <FiGrid className="h-5 w-5 mr-2" /> })) : []
          }))
          : [
            // { href: "/movies", label: t('navigation.movies'), icon: <FiFilm className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.sports') || 'Sports', icon: <FiSmile className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.tv') || 'TV', icon: <FiTv className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.dramas') || 'Dramas', icon: <FiGrid className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.music') || 'My Music', icon: <FiMusic className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.entertainment') || 'Entertainment', icon: <FiSmile className="h-5 w-5 mr-2" /> },
            // { href: "/?", label: t('navigation.technology') || 'Technology', icon: <FiCpu className="h-5 w-5 mr-2" /> },
          ]
      },
      { href: "/?", label: t('navigation.contact') || 'Contact', icon: <FiMail className="h-5 w-5 mr-2" /> },
    ];

    if (isAuthenticated) {
      baseMenu.splice(2, 0, { href: "/profile", label: t('navigation.profile'), icon: <FiUser className="h-5 w-5 mr-2" /> });
      if(user && user.userType==1 )
      {baseMenu.splice(3, 0, { href: "/upload", label: t('navigation.upload', 'Upload'), icon: <FiUpload className="h-5 w-5 mr-2" /> });}
    }

    return baseMenu;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDropdownToggle = (labelOrArray: string | string[]) => {
  setUserToggled(true);
    if (Array.isArray(labelOrArray)) {
      // Replace the dropdown state directly when an array is provided.
      // If the provided array is equal to current state, collapse one level (remove last item).
      setOpenDropdown((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(labelOrArray)) {
          // collapse one level
          if (prev.length === 0) return [];
          return labelOrArray.slice(0, -1);
        } else {
          const last = labelOrArray[labelOrArray.length - 1];
          const idx = prev.indexOf(last);
          if (idx > -1) {
            // remove from found index and above

            return prev.slice(-1, idx);
          } else {
            return [...labelOrArray];
          }
        }
      });
      return;
    }
    const label = labelOrArray;
    setOpenDropdown((prev) => {
      if (prev.includes(label)) return prev.filter((l) => l !== label);
      return [...prev, label];
    });
  };

  return (
    <div className={`pt-18 md:pt-25 bg-black/80 fixed lg:relative h-screen text-white py-6 z-40  ${show ? 'w-[70vw] lg:w-[20vw]' : 'w-0'} transition-width duration-300 ease-in-out`}>
      <div className={`fixed bg-black/80  px-4 h-full ${show ? 'w-[70vw] lg:w-[20vw]' : 'w-0 hidden'} transition-width duration-300 ease-in-out`}>
        {/* <h1 className="text-3xl font-bold mt-2 mb-10">OTalk.TV</h1> */}
        <ul>
          <RecursiveMenu
            items={getMenu() as MenuItem[]}
            pathname={pathname}
            openDropdown={openDropdown}
            onToggle={handleDropdownToggle}
            userToggled={userToggled}
          />
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

