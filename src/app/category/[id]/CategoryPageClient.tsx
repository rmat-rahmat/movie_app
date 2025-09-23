'use client';

import React, { useEffect, useState } from 'react';
import { getCategoryVideos, getCachedCategories, getDashboard } from '@/lib/movieApi';
import CategoryVideos from '@/components/movie/CategoryVideos';
import LoadingPage from '@/components/ui/LoadingPage';
import type { CategoryItem } from '@/types/Dashboard';

export default function CategoryPageClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState(`Category ${id}`);

  // Helper function to find category name
  const findCategoryName = (categoryId: string): string | null => {
    const categories = getCachedCategories();
    if (!categories) return null;

    const searchCategory = (items: (CategoryItem & { children?: CategoryItem[] })[]): string | null => {
      for (const item of items) {
        if (item.id === categoryId) {
          return item.categoryName || item.categoryAlias || null;
        }
        if (item.children && item.children.length > 0) {
          const found = searchCategory(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return searchCategory(categories);
  };

  useEffect(() => {
    async function initializePage() {
      try {
        setLoading(true);

        if (!id) {
          setError('Category ID not found');
          return;
        }

        // Try to get category name from cached categories
        let foundCategoryName = findCategoryName(id);
        
        if (!foundCategoryName) {
          // Fallback: try to get from dashboard API
          try {
            const dashboard = await getDashboard(false);
            const categories = dashboard?.data?.categories;
            if (categories) {
              const category = categories.find((cat: CategoryItem) => cat.id === id);
              if (category) {
                foundCategoryName = category.categoryName || category.categoryAlias || null;
              }
            }
          } catch (dashboardError) {
            console.warn('Failed to fetch dashboard for category name:', dashboardError);
          }
        }

        const finalCategoryName = foundCategoryName || `Category ${id}`;
        setCategoryName(finalCategoryName);

        // Update document title and meta
        document.title = `${finalCategoryName} | OTalk.TV`;
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', `Browse ${finalCategoryName} movies and TV shows. Discover great content and entertainment in this category.`);
        }

        // Validate that category exists by trying to fetch some content
        // const initialData = await getCategoryVideos(id, 1, 10);
        // if (!initialData || !initialData.success) {
        //   setError('Category not found');
        //   return;
        // }

        setError(null);
      } catch (err) {
        console.error('Error initializing category page:', err);
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [id]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <CategoryVideos 
      categoryId={id} 
      categoryName={categoryName}
    />
  );
}
