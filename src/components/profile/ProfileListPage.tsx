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
import ProfileWrapper from '@/app/profile/ProfileWrapper';

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

    <ProfileWrapper title={title} subHeaderRight={
      showClearButton && clearItems && (
        <button
          className="flex rounded-full items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          onClick={handleClear}
        >
          <FiTrash2 /><span className="hidden md:inline">{clearButtonText}</span>
        </button>
      )
    }>
      {/* Content */}

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
    </ProfileWrapper>
  );
}
