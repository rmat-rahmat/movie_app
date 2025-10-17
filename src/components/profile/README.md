# Profile Components

This folder contains reusable components for profile-related pages.

## ProfileListPage

A reusable component for displaying paginated lists of videos in profile sections (Watch History, Favorites, Your Videos).

### Features
- ✅ Consistent UI across all profile list pages
- ✅ Pagination with "Load More" functionality
- ✅ Optional clear/delete functionality
- ✅ Profile header with user info and settings
- ✅ Empty state handling
- ✅ Internationalization support
- ✅ Loading states

### Props

```typescript
interface ProfileListPageProps {
  title: string;                    // Page title (e.g., "Watch History")
  emptyMessage: string;              // Message shown when list is empty
  fetchItems: (page: number, size: number, type?: string) => Promise<DashboardItem[] | null>;
  clearItems?: () => Promise<boolean>;  // Optional function to clear all items
  showClearButton?: boolean;         // Show/hide clear button (default: false)
  clearButtonText?: string;          // Text for clear button (default: "Clear")
  clearConfirmMessage?: string;      // Confirmation message before clearing
}
```

### Usage Example

```tsx
import ProfileListPage from '@/components/profile/ProfileListPage';
import { getFavoritesList } from '@/lib/movieApi';

export default function FavoritesPage() {
  return (
    <ProfileListPage
      title="My Favorites"
      emptyMessage="No favorite videos yet"
      fetchItems={getFavoritesList}
      showClearButton={false}
    />
  );
}
```

## Pages Using ProfileListPage

1. **Watch History** (`/profile/history`)
   - Shows user's watch history
   - Includes clear history button
   - Pagination enabled

2. **My Favorites** (`/profile/favorites`)
   - Shows user's favorited videos
   - No clear button
   - Pagination enabled

3. **Your Videos** (`/profile/your-videos`)
   - Shows user's uploaded videos
   - No clear button
   - Pagination enabled
