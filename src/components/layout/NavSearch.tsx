"use client";

import { Suspense ,useEffect} from 'react';
import { SearchInput } from '@/components/search';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';

interface NavSearchProps {
  className?: string;
hide?: () => void;
}

export default function NavSearch({ className = " lg:block mx-6 flex-1 max-w-md", hide }: NavSearchProps) {
  const { t } = useTranslation('common');

  return (
    <>
    <div className={`${className}`}>
      <Suspense fallback={<div className="h-10 bg-gray-800 rounded"></div>}>
        <SearchInput placeholder={t('common.searchPlaceholder')} />
      </Suspense>
    </div>
     <button
          className={`z-100 md:hidden flex items-center justify-center p-2 rounded text-gray-200 mr-0 `}
          onClick={()=>location.href="/search"}
          aria-label={t('navigation.openMenu')}
        >
          <FiSearch size={22} />
        </button>
    </>
  );
}