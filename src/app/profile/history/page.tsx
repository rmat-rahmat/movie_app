'use client';

import React, { useEffect, useState } from 'react';
import LoadingPage from '@/components/ui/LoadingPage';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { getWatchHistoryList, clearWatchHistory } from '@/lib/movieApi';
import { DashboardItem } from '@/types/Dashboard';
import DashboardSection from '@/components/movie/DashboardSection';
import { FiTrash2, FiChevronLeft, FiSettings, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

export default function HistoryPage() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const subscribersCount = user?.subscribers;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const load = async () => {
      const list = await getWatchHistoryList(1, 24);
      setItems(list || []);
      setPage(0);
      setHasMore(false);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLoadMore = async () => {
    const next = page + 1;
    const list = await getWatchHistoryList(next, 24);
    if (list && list.length > 0) {
      setItems((s) => [...s, ...list]);
      setPage(next);
      setHasMore(true);
    } else {
      setHasMore(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(t('profile.confirmClearHistory', 'Clear watch history? This cannot be undone.'))) return;
    setLoading(true);
    const ok = await clearWatchHistory();
    if (ok) {
      setItems([]);
    }
    setLoading(false);
  };

  if (loading || authLoading || !user) return <LoadingPage />;

  return (
    <div className="min-h-screen p-6 text-white">
        <div className="bg-black order-last md:order-first flex items-end md:pl-20 overflow-visible">
                        <div className="flex items-center gap-4 p-4 min-w-[200%] z-1">
                            <Image src={user?.avatar || '/fallback_poster/sample_poster.png'} alt={user?.nickname || "avatar"} width={30} height={30} className="w-30 h-30 lg:min-w-50 lg:min-h-50 rounded-full mr-2 object-cover" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold">{user?.name || user?.nickname || 'User'}</h1>
                                <p className="text-gray-400 mb-2 w-[60vw] md:w-[40vw] pr-15">
                                    {t('profile.welcome', { name: user?.name || user?.nickname || 'User' })}
                                </p>
                                <div className="flex items-center gap-2 flex-col md:flex-row pr-15 md:pr-0">
                                    {/* <button className="bg-[#fbb033] text-white px-4 py-2 rounded font-semibold w-full md:w-fit hover:bg-red-700 transition">
                                        {`${t('profile.subscribeLabel') || 'Subscribe'} ${subscribersCount ? `(${formatSubscribers(Number(subscribersCount))})` : ''}`}
                                    </button> */}
                                    <Link href="/settings" className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition">
                                        <FiSettings className="h-4 w-4" />
                                        <span className="text-sm">{t('profile.settings') || 'Settings'}</span>
                                    </Link>
                                    <button className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition" onClick={() => useAuthStore.getState().logout()}>
                                        <FiLogOut className="h-4 w-4" />
                                        <span className="text-sm">{t('navigation.logout') || 'Logout'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2">
              <FiChevronLeft /> {t('profile.backToProfile', 'Back')}
            </Link>
            {/* <h1 className="text-2xl font-bold">{t('profile.watchHistory', 'Watch history')}</h1> */}
          </div>
          <div>
            <button className="flex items-center gap-2 bg-red-600 px-3 py-2 rounded" onClick={handleClear}>
              <FiTrash2 /> {t('profile.clearHistory', 'Clear history')}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-gray-400">{t('profile.noHistory', 'No watch history')}</div>
        ) : (
          <div className="space-y-6">
            <DashboardSection
              title={t('profile.watchHistory', 'Watch history')}
              videos={items}
              onViewMore={undefined}
            />
            <div className="flex justify-center">
              {hasMore ? (
                <button className="px-4 py-2 bg-gray-800 rounded" onClick={handleLoadMore}>{t('viewMore', 'View more')}</button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
