import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menu = [
  { href: "/", label: "Home", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  { href: "/?", label: "About", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  { href: "/movies", label: "Movies", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 7l18 0" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  { href: "/?", label: "Pages", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  { label: "Categories", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="6" cy="6" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="6" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), subMenu: [
      { href: "/movies", label: "Movies", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "Sports", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 16c0-2.21 1.79-4 4-4s4 1.79 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8v4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="8" r="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "TV", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 7l18 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "Dramas", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="6" cy="6" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="6" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "My Music", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h5l2-2h5a2 2 0 012 2v12a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "Entertainment", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M21 10.5a8.38 8.38 0 01-.9 3.8c-.6 1.1-1.5 2.1-2.6 2.8a8.5 8.5 0 01-8.6 0c-1.1-.7-2-1.7-2.6-2.8a8.38 8.38 0 01-.9-3.8C3 6.5 7.03 3 12 3s9 3.5 9 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17v.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
      { href: "/?", label: "Technology", icon: (
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 2v4M16 2v4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) },
    ]},
  { href: "/?", label: "Blog", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h5l2-2h5a2 2 0 012 2v12a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  { href: "/?", label: "Contact", icon: (
      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 16.92V19a2 2 0 01-2.18 2A19.72 19.72 0 013 5.18 2 2 0 015 3h2.09a2 2 0 012 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 01-.45 2.11l-.27.27a16 16 0 006.29 6.29l.27-.27a2 2 0 012.11-.45c.99.35 2.01.59 3.06.72a2 2 0 011.72 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
];

const SideBar = ({ show }: { show: boolean }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <div className={`fixed top-0 left-0 h-screen w-64 text-white px-4 py-6 shadow-[0px_0px_10px_1px] shadow-green-500/50 z-100 bg-black ${show ? 'block' : 'hidden'} transition-transform duration-300 ease-in-out md:block`}>
      <h1 className="text-3xl font-bold mt-2 mb-10">Seefu.TV</h1>
      <ul>
        {menu.map(({ href, label, icon, subMenu }) => (
          <li key={label}>
            {subMenu ? (
              <>
                <button
                  onClick={() => handleDropdownToggle(label)}
                  className={`flex w-full cursor-pointer items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-green-500/50
                    ${openDropdown === label ? "bg-gradient-to-l from-green-500/50 to-green-500/0 font-bold" : ""}
                  `}
                >
                  {icon}
                  {label}
                </button>
                {openDropdown === label && (
                  <ul className="pl-8">
                    {subMenu.map(({ href, label, icon }) => (
                      <li key={href}>
                        <Link href={href}>
                          <p className={`flex items-center block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-green-500/50 
                            ${pathname === href ? "bg-gradient-to-l from-green-500/50 to-green-500/0 font-bold" : ""}
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
                <p className={`flex items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-green-500/50
                  ${pathname === href ? "bg-gradient-to-l from-green-500/50 to-green-500/0 font-bold" : ""}
                `}>
                  {icon}
                  {label}
                </p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideBar;

