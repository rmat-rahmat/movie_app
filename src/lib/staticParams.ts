// This file generates static params for dynamic routes
import fs from 'fs';
import path from 'path';
import { getDashboard, getCachedCategories } from '@/lib/movieApi';
import type { ContentSection } from '@/types/Dashboard';

function collectIdsFromCategories(categories: unknown): string[] {
  const ids: string[] = [];
  const walk = (items: unknown[]): void => {
    if (!Array.isArray(items)) return;
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const item = it as { id?: unknown; children?: unknown[] };
      if (item.id) ids.push(String(item.id));
      if (Array.isArray(item.children) && item.children.length) walk(item.children);
    }
  };
  walk(Array.isArray(categories) ? categories : []);
  return ids;
}

function extractCategoryIdsFromManifest(manifestPath: string): string[] {
  try {
    if (!fs.existsSync(manifestPath)) return [];
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const json = JSON.parse(raw);
    const routes = json.routes || json || {};
    const ids: string[] = [];
    for (const key of Object.keys(routes)) {
      // key like '/category/<id>'
      const m = key.match(/^\/category\/(.+)$/);
      if (m && m[1]) ids.push(m[1]);
    }
    return ids;
  } catch (_e) {
    return [];
  }
}

export async function generateCategoryParams() {
  try {
    const dashboard = await getDashboard(false);
    const idsFromDashboard = collectIdsFromCategories(dashboard?.data?.categories || []);

    // also check any cached categories (local build-time cache or previous run)
    const cached = getCachedCategories ? getCachedCategories() : null;
    const idsFromCache = collectIdsFromCategories(cached || []);

    // attempt to read prior prerender manifests (if present in workspace) to pick up ids
    const projectRoot = process.cwd();
    const candidates = [
      path.join(projectRoot, '.next', 'prerender-manifest.json'),
      path.join(projectRoot, 'out', 'prerender-manifest.json'),
    ];
    const idsFromManifests = candidates.flatMap((p) => extractCategoryIdsFromManifest(p));

    const allIds = Array.from(new Set([...idsFromDashboard, ...idsFromCache, ...idsFromManifests].filter(Boolean)));

    if (allIds.length > 0) return allIds.map((id) => ({ id }));

    // final small fallback when nothing else is available
    return [
      { id: 'action' },
      { id: 'comedy' },
      { id: 'drama' },
      { id: 'horror' },
      { id: 'romance' },
      { id: 'thriller' },
      { id: 'animation' },
      { id: 'documentary' },
    ];
  } catch (error) {
    console.warn('Failed to generate category params:', error);
    return [
      { id: 'action' },
      { id: 'comedy' },
      { id: 'drama' },
      { id: 'horror' },
      { id: 'romance' },
      { id: 'thriller' },
      { id: 'animation' },
      { id: 'documentary' },
    ];
  }
}

export async function generateSectionParams() {
  try {
    const dashboard = await getDashboard(false);
    const sections = dashboard?.data?.contentSections || [];
    return sections
      .map((section: ContentSection) => ({ id: section.id }))
      .filter((param) => param.id);
  } catch (error) {
    console.warn('Failed to generate section params:', error);
    // Return some common section IDs as fallback
    return [
      { id: 'featured' },
      { id: 'trending' },
      { id: 'latest' },
      { id: 'popular' },
      { id: 'recommended' },
      { id: 'new_releases' },
    ];
  }
}
