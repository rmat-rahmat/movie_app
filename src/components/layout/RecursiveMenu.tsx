import React from 'react';
import Link from 'next/link';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export type MenuItem = { href?: string; name?: string; label: string; icon?: React.ReactNode; subMenu?: MenuItem[] };

interface RecursiveMenuProps {
    items: MenuItem[];
    pathname?: string | null;
    openDropdown: string[]; // allow multiple open keys
    // accept either a single label (toggle) or an array to set explicitly
    onToggle: (labelOrArray: string | string[]) => void;
    depth?: number;
    userToggled?: boolean; // Add userToggled prop
}

const RecursiveMenu: React.FC<RecursiveMenuProps> = ({ items, pathname, openDropdown, onToggle, depth = 0, userToggled = false }) => {
    // Recursively check if any descendant in the tree matches the pathname
    const hasDescendantMatch = (list: MenuItem[] | undefined, path?: string | null,userAction?:boolean): boolean => {
        if (!list || !list.length || !path) return false;
        for (const it of list) {

            if (it.href === path && !userAction) return true;
            if (it.subMenu && hasDescendantMatch(it.subMenu, path)) return true;
        }
        return false;
    };

    const renderMenu = (list: MenuItem[], level = depth, parentStack: string[] = []) => {
        let userAction=false;
        return list.map((item, idx) => {
            const { href, label, icon, subMenu,name } = item;
            if (subMenu && subMenu.length) {
                // check any descendant (unlimited depth) for current pathname
                const shouldOpen = !(userToggled) && hasDescendantMatch(subMenu, pathname, userAction);
                // depth-aware open: openDropdown stores the stack of labels for the open path
                const isOpen = ( openDropdown[level] === label) ||  ( openDropdown[level] === name) || shouldOpen;

                const key = [...parentStack, label, String(idx)].join('>');
                return (
                    <li key={key}>
                        <button
                            onClick={() => {
                                userAction=true;
                                onToggle([...parentStack, name || label])
                            }}
                            className={`text-[4vw] md:text-lg flex w-full cursor-pointer items-center rounded-md block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033] ${isOpen ? 'bg-gradient-to-l from-[#fbb033] to-transparent font-bold' : ''
                                }`}
                        >
                            {icon}
                            {label}
                            {isOpen ? <FiChevronUp className="ml-auto" /> : <FiChevronDown className="ml-auto" />}
                        </button>
                        <ul
                            style={{ paddingLeft: `${8 + Number(level) * 10}px` }}
                            className={`py-2 h-[${subMenu.length * 4}vh] overflow-y-auto ${isOpen ? 'block' : 'hidden'} pr-1`}
                        >
                            {renderMenu(subMenu, Number(level) + 1, [...parentStack, label])}
                        </ul>
                    </li>
                );
            }

            const key = [...parentStack, label, String(idx)].join('>');
            return (
                <li key={key}>
                    <Link href={href || '#'}>
                        <p
                            className={`text-[4vw] md:text-lg flex w-full rounded-md items-center block p-2 mb-2 hover:shadow-[0px_0px_10px_1px] shadow-[#fbb033] ${pathname === href ? 'bg-gradient-to-l from-[#fbb033] to-transparent font-bold' : ''
                                }`}
                        >
                            {icon}
                            {label}
                        </p>
                    </Link>
                </li>
            );
        });
    };

    return <>{renderMenu(items)}</>;
};

export default RecursiveMenu;
