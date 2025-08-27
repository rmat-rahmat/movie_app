import React from 'react';
import type { Metadata } from 'next';
import { getDashboard } from '@/lib/movieApi';
import type { DashboardApiResponse, DashboardItem, CategoryItem } from '@/types/Dashboard';

// We'll accept an unknown/any `params` shape at runtime because Next may supply
// either a plain object or a Promise; keeping the parameter untyped avoids
// mismatches with Next's internal PageProps constraint.

function findCategoryById(list: CategoryItem[] | undefined, id?: string): CategoryItem | null {
  if (!list || !list.length) return null;
  for (const c of list) {
    if (String(c.id) === String(id)) return c;
    if (Array.isArray(c.children) && c.children.length) {
      const found = findCategoryById(c.children as CategoryItem[], id);
      if (found) return found;
    }
  }
  return null;
}

function gatherItemsForCategory(payload: DashboardApiResponse | null, id?: string): DashboardItem[] {
  if (!payload || !payload.data) return [];
  const items: DashboardItem[] = [];
  const addIfMatch = (it?: DashboardItem[]) => {
    if (!it) return;
    it.forEach((d) => {
  if (d.categoryId && String(d.categoryId) === String(id)) items.push(d);
    });
  };

  // featuredContent
  addIfMatch(payload.data.featuredContent as DashboardItem[] | undefined);
  // contentSections
  if (Array.isArray(payload.data.contentSections)) {
    payload.data.contentSections.forEach((s) => addIfMatch(s.contents as DashboardItem[] | undefined));
  }

  return items;
}

export async function generateMetadata(args: unknown): Promise<Metadata> {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');
  const dash = await getDashboard();
  const cat = findCategoryById(dash?.data?.categories, id);
  return {
    title: cat ? `${cat.categoryName || cat.categoryAlias}` : `Category ${id}`,
  };
}

export default async function Page(args: unknown) {
  type ParamsLike = { id: string } | Promise<{ id: string }>;
  const params = (args as { params?: ParamsLike })?.params;
  const p = params as ParamsLike | undefined;
  const resolvedParams = (await p) as { id: string } | undefined;
  const id = String(resolvedParams?.id ?? (params as { id?: string })?.id ?? '');
  const dash = await getDashboard();

  if (!dash) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Category</h1>
        <p className="mt-4">Unable to load dashboard data.</p>
      </div>
    );
  }

  const category = findCategoryById(dash.data?.categories, id);
  const items = gatherItemsForCategory(dash, id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{category?.categoryName || category?.categoryAlias || `Category ${id}`}</h1>
      {category?.description && <p className="text-sm text-gray-400 mt-1">{category.description}</p>}

      <section className="mt-6">
        {items.length === 0 ? (
          <p className="text-gray-400">No items found for this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((it) => (
              <article key={it.id} className="bg-[#0b0b0b] p-3 rounded-md">
                <div className="h-40 w-full bg-cover bg-center rounded-md" style={{ backgroundImage: `url(${it.customCoverUrl || it.coverUrl || ''})` }} />
                <h3 className="mt-3 font-semibold">{it.title}</h3>
                {it.description && <p className="text-sm text-gray-400 mt-1 line-clamp-3">{it.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
