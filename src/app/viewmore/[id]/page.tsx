import React from 'react';
import { generateSectionParams } from '@/lib/staticParams';
import ViewMorePageClient from './ViewMorePageClient';

export async function generateStaticParams() {
  return await generateSectionParams();
}

export default async function ViewMorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ViewMorePageClient id={id} />;
}
