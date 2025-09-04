import React from 'react';
import { generateCategoryParams } from '@/lib/staticParams';
import CategoryPageClient from './CategoryPageClient';

export async function generateStaticParams() {
  return await generateCategoryParams();
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryPageClient id={id} />;
}
