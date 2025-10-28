'use client';

import React, { useEffect, useState } from 'react';
import LoadingPage from '@/components/ui/LoadingPage';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { DashboardItem } from '@/types/Dashboard';
import DashboardSection from '@/components/movie/DashboardSection';
import { FiTrash2, FiChevronLeft, FiSettings, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

interface ProfileListPageProps {
  title: string;
  emptyMessage: string;
  fetchItems: (page: number, size: number, type?: string) => Promise<DashboardItem[] | null>;
  clearItems?: () => Promise<boolean>;
  showClearButton?: boolean;
  clearButtonText?: string;
  clearConfirmMessage?: string;
}

export default function ProfileListPage({
  title,
  emptyMessage,
  fetchItems,
  clearItems,
  showClearButton = false,
  clearButtonText = 'Clear',
  clearConfirmMessage = 'Are you sure? This cannot be undone.',
}: ProfileListPageProps) {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const load = async () => {
      const list = await fetchItems(1, 24, '720');
      setItems(list || []);
      setPage(1);
      setHasMore((list && list.length === 24) || false);
      setLoading(false);
    };
    load();
  }, [user, fetchItems]);

  const handleLoadMore = async () => {
    const next = page + 1;
    const list = await fetchItems(next, 24, '720');
    if (list && list.length > 0) {
      setItems((s) => [...s, ...list]);
      setPage(next);
      setHasMore(list.length === 24);
    } else {
      setHasMore(false);
    }
  };

  const handleClear = async () => {
    if (!clearItems) return;
    if (!confirm(clearConfirmMessage)) return;
    setLoading(true);
    const ok = await clearItems();
    if (ok) {
      setItems([]);
    }
    setLoading(false);
  };

  if (loading || authLoading || !user) return <LoadingPage />;

  return (
    <div className="min-h-screen text-white">
      {/* Profile Header */}
      <div className="bg-black flex items-end md:pl-20 overflow-visible py-6">
        <div className="flex items-center gap-4 p-4 z-1">
          <Image 
            src={user?.avatar || '/fallback_poster/sample_poster.png'} 
            alt={user?.nickname || "avatar"} 
            width={50} 
            height={50} 
            className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover" 
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">{user?.name || user?.nickname || 'User'}</h1>
            <p className="text-gray-400 text-sm">
              {t('profile.welcome', { name: user?.name || user?.nickname || 'User' })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/settings" className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded font-medium hover:bg-gray-700 transition text-sm">
                <FiSettings className="h-4 w-4" />
                <span>{t('profile.settings') || 'Settings'}</span>
              </Link>
              <button 
                className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded font-medium hover:bg-gray-700 transition text-sm" 
                onClick={() => useAuthStore.getState().logout()}
              >
                <FiLogOut className="h-4 w-4" />
                <span>{t('navigation.logout') || 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2">
              <FiChevronLeft /> {t('profile.backToProfile', 'Back to Profile')}
            </Link>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          {showClearButton && clearItems && (
            <button 
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition" 
              onClick={handleClear}
            >
              <FiTrash2 /> {clearButtonText}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardSection
              title=""
              videos={items}
              onViewMore={undefined}
            />
            {hasMore && (
              <div className="flex justify-center">
                <button 
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded transition font-medium" 
                  onClick={handleLoadMore}
                >
                  {t('common.loadMore', 'Load More')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
