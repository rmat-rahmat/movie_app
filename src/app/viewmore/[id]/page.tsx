import React from 'react';
import type { Metadata } from 'next';
import { getGridVideos, getDashboard } from '@/lib/movieApi';
import type { ContentSection } from '@/types/Dashboard';
import GridVideos from '@/components/movie/GridVideos';
import { notFound } from 'next/navigation';

// We'll accept an unknown/any `params` shape at runtime because Next may supply
// either a plain object or a Promise; keeping the parameter untyped avoids
// mismatches with Next's internal PageProps constraint.

export async function generateMetadata(args: unknown): Promise<Metadata> {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');
  const sectionName = id?.replaceAll('_', ' ');

  // Try to get category name from cached categories
 
  
  return {
    title: `${sectionName}`,
    description: `Browse movies and TV shows in ${sectionName}. Discover great content and entertainment.`,
    keywords: ['movies', 'tv shows', 'category', 'entertainment', sectionName.toLowerCase()],
  };
}

// Provide static params for static export builds by enumerating section ids
export async function generateStaticParams() {
  try {
    const dashboard = await getDashboard(false);
    const sections = (dashboard?.data?.contentSections ?? []) as ContentSection[];
    if (!Array.isArray(sections)) return [];
    return sections
      .map((s) => s?.id)
      .filter(Boolean)
      .map((id) => ({ id: String(id) }));
  } catch (_e) {
    // If fetching fails at build time, return an empty list to avoid build errors.
    return [];
  }
}

export default async function Page(args: unknown) {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');
  const sectionName = id.replaceAll('_', ' ');
  // Validate that we have a category ID
  console.log(`Validating category ID: ${id}`);
  if (!id) {
    notFound();
  }

  // Fetch initial data to check if category exists
  const initialData = await getGridVideos(`/api-movie/v1/home/sections/${id}/contents`, 1, 1);

  if (!initialData || !initialData.success) {
    notFound();
  }

  return (
      <GridVideos 
        id={id} 
        title={sectionName}
        src={`/api-movie/v1/home/sections/${id}/contents`}
      />
  );
}
