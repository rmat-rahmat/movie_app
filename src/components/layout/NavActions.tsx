"use client";

import Link from "next/link";
import Image from "next/image";
import { FiUpload, FiUser } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import {type User } from '../../store/authStore';

interface NavActionsProps {
  type: 'guest' | 'protected';
  user?: User|null;
  avatarUrl?: string;
  displayName?: string;
  initials?: string;
  className?: string;
}

export default function NavActions({ 
  type, 
  user, 
  avatarUrl, 
  displayName = 'User', 
  initials, 
  className = "hidden lg:flex gap-1 items-center" 
}: NavActionsProps) {
  const { t } = useTranslation('common');

  if (type === 'guest') {
    return (
      <ul className={className}>
        <li>
          <Link href="/auth/login" className="text-gray-200 hover:underline">
            <p className="flex items-center rounded-lg block py-2 px-4 mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#f69c05]">
              <FiUser className="h-5 w-5 mr-2" />
              {t('navigation.login')}
            </p>
          </Link>
        </li>
      </ul>
    );
  }

  return (
    <ul className={className}>
      {user && user.userType == 1 && (
        <li>
          <Link href="/upload" className="text-gray-200 hover:underline">
            <p className="flex items-center rounded-lg block py-2 px-4 mb-2 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033] transform transition-transform duration-200 hover:scale-105">
              <FiUpload className="h-5 w-6 mb-1" />
              {t('navigation.upload')}
            </p>
          </Link>
        </li>
      )}
      <li>
        <Link href="/profile" className="text-gray-200">
          <div className="flex items-center py-2 px-4 mb-2 transform transition-transform duration-200 hover:scale-105">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={28} height={28} className="rounded-full w-10 h-10 mr-2 object-cover" />
            ) : (
              <div className="h-7 w-7 mr-2 rounded-full bg-[#fbb033] text-black flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
            )}
            <span className="hidden md:inline">{t('profile.greeting', { name: displayName.split(' ')[0] })}</span>
          </div>
        </Link>
      </li>
    </ul>
  );
}