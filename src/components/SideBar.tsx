import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  FiLogIn
} from 'react-icons/fi';

const menu = [
  { href: "/", label: "Home", icon: <FiHome className="h-5 w-5 mr-2" /> },
  { href: "/?", label: "About", icon: <FiInfo className="h-5 w-5 mr-2" /> },
  { href: "/movies", label: "Movies", icon: <FiFilm className="h-5 w-5 mr-2" /> },
  { href: "/?", label: "Pages", icon: <FiLayers className="h-5 w-5 mr-2" /> },
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
  { href: "/?", label: "Blog", icon: <FiBook className="h-5 w-5 mr-2" /> },
  { href: "/?", label: "Contact", icon: <FiMail className="h-5 w-5 mr-2" /> },
  { href: "/profile", label: "Profile", icon: <FiUser className="h-5 w-5 mr-2" /> }, // <-- Added profile link
];

const SideBar = ({ show }: { show: boolean }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <div className={`fixed top-0 left-0 h-screen w-64 text-white px-4 py-6 shadow-[0px_0px_10px_1px] shadow-[#e50914] z-100 bg-black/90 ${show ? 'block' : 'hidden'} transition-transform duration-300 ease-in-out md:block`}>
      <h1 className="text-3xl font-bold mt-2 mb-10">Seefu.TV</h1>
      <ul>
        {menu.map(({ href, label, icon, subMenu }) => (
          <li key={label}>
            {subMenu ? (
              <>
                <button
                  onClick={() => handleDropdownToggle(label)}
                  className={`flex w-full cursor-pointer items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]
                    ${openDropdown === label ? "bg-gradient-to-l from-[#e50914] to-transparent font-bold" : ""}
                  `}
                >
                  {icon}
                  {label}
                  {openDropdown === label ? <FiChevronUp className="ml-auto" /> : <FiChevronDown className="ml-auto" />}
                </button>
                {openDropdown === label && (
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
              </>
            ) : (
              <Link href={href}>
                <p className={`flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]
                  ${pathname === href ? "bg-gradient-to-l from-[#e50914] to-transparent font-bold" : ""}
                `}>
                  {icon}
                  {label}
                </p>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="absolute bottom-6 left-4 w-[calc(100%-2rem)] md:hidden">
        <Link href={'/auth/login'}>
          <p className="flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#e50914]">
        <FiLogIn className="h-5 w-5 mr-2" />
        Sign In/Up
          </p>
        </Link>
      </div>
    </div>
  );
};

export default SideBar;

