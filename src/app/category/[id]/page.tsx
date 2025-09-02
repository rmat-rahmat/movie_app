import React from 'react';
import type { Metadata } from 'next';
import { getCategoryVideos, getCachedCategories } from '@/lib/movieApi';
import CategoryVideos from '@/components/movie/CategoryVideos';
import { notFound } from 'next/navigation';
import type { CategoryItem } from '@/types/Dashboard';

// We'll accept an unknown/any `params` shape at runtime because Next may supply
// either a plain object or a Promise; keeping the parameter untyped avoids
// mismatches with Next's internal PageProps constraint.

export async function generateMetadata(args: unknown): Promise<Metadata> {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');

  // Try to get category name from cached categories
  let categoryName = `Category ${id}`;
  
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

    return searchCategory(categories as (CategoryItem & { children?: CategoryItem[] })[]);
  };

  const foundName = findCategoryName(id);
  if (foundName) {
    categoryName = foundName;
  }
  
  return {
    title: `${categoryName} - Movies & TV Shows`,
    description: `Browse movies and TV shows in ${categoryName}. Discover great content and entertainment.`,
    keywords: ['movies', 'tv shows', 'category', 'entertainment', categoryName.toLowerCase()],
  };
}

export default async function Page(args: unknown) {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');

  // Validate that we have a category ID
  if (!id) {
    notFound();
  }

  // Fetch initial data to check if category exists
  const initialData = await getCategoryVideos(id, 1, 1);

  if (!initialData || !initialData.success) {
    notFound();
  }

  return (
      <CategoryVideos 
        categoryId={id} 
        categoryName={undefined}
      />
  );
}
