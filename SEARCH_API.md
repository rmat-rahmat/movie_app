# Search API Implementation

## Overview
This document outlines the implementation of the search API for finding videos based on search terms with optional category filtering and pagination support.

## API Endpoint
- **URL**: `/api-movie/v1/search/searchVideo`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| searchName | string | Yes | Search term/query |
| categoryId | string | No | Category ID to filter results (empty string for all categories) |
| page | integer | Yes | Page number (starts from 1) |
| size | integer | Yes | Number of items per page |

## Request Body Example
```json
{
  "searchName": "Action",
  "categoryId": "123",
  "page": 1,
  "size": 10
}
```

## Response Structure
```typescript
interface SearchApiResponse {
  status: number;
  code?: string;
  success: boolean;
  message?: string;
  data: VideoVO[];
  pageInfo?: PageInfo;
  // ... additional error handling fields
}
```

## Implementation Files

### 1. Types (`src/types/Dashboard.ts`)
- `SearchApiResponse`: Complete API response type
- Extended `CategoryItem` with `children` and `depth` properties for hierarchical display

### 2. API Function (`src/lib/movieApi.ts`)
```typescript
export async function searchVideos(
  searchName: string, 
  categoryId: string = "", 
  page: number = 1, 
  size: number = 10
): Promise<SearchApiResponse | null>
```

### 3. Search Component (`src/components/search/SearchVideos.tsx`)
**Features:**
- ✅ Real-time search with form submission
- ✅ Category filtering with hierarchical dropdown
- ✅ Pagination with load more functionality
- ✅ URL parameter integration (q, category)
- ✅ Error handling with retry functionality
- ✅ Loading states for better UX
- ✅ Responsive grid layout
- ✅ Fallback images for video posters
- ✅ Search result count display
- ✅ Clear search functionality

### 4. Search Input Component (`src/components/search/SearchInput.tsx`)
**Features:**
- ✅ Compact search input for headers/navigation
- ✅ Auto-redirect to search page
- ✅ URL parameter handling
- ✅ Customizable styling

### 5. Search Page (`src/app/search/page.tsx`)
- ✅ URL parameter integration
- ✅ Initial query handling
- ✅ SEO-friendly structure

## Features

### Search Functionality
- **Text Search**: Search by video title, description
- **Category Filtering**: Filter results by specific categories
- **Pagination**: Load more results or page-based navigation
- **URL Integration**: Shareable search URLs with parameters
- **Auto-suggestions**: Search as you type (ready for future enhancement)

### User Experience
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading States**: Clear feedback during API calls
- **Error Handling**: Graceful error messages and retry options
- **Empty States**: Helpful messages when no results found
- **Search History**: URL-based search history navigation

### Performance
- **Lazy Loading**: Load more results on demand
- **Category Caching**: Use cached category data
- **Optimized Rendering**: Efficient grid layout
- **Image Fallbacks**: Handle missing poster images

## Usage

### Basic Search
```typescript
import { SearchVideos } from '@/components/search';

<SearchVideos initialQuery="action movies" />
```

### Header Search Input
```typescript
import { SearchInput } from '@/components/search';

<SearchInput placeholder="Search videos..." className="w-64" />
```

### Direct API Usage
```typescript
import { searchVideos } from '@/lib/movieApi';

const results = await searchVideos("comedy", "category123", 1, 20);
```

### URL Parameters
```
/search?q=action%20movies&category=123
```

## Search Strategies

The search function supports multiple matching strategies:
1. **Exact title match**
2. **Description contains keyword**
3. **Tag matching**
4. **Category-filtered search**
5. **Multi-word search support**

## Configuration

### Page Size
Default: 10 videos per page
- Configurable in `SearchVideos.tsx`
- Balance between performance and user experience

### Category Hierarchy
- Supports nested categories with visual indentation
- Automatically flattens category tree for dropdown display
- Preserves parent-child relationships

### Fallback Images
Located in `/public/fallback_poster/`:
- `sample_poster.png`
- `sample_poster1.png`

## Testing

### Manual Testing
1. **Basic Search**: Enter search terms and verify results
2. **Category Filtering**: Select categories and verify filtered results
3. **Pagination**: Test load more functionality
4. **URL Parameters**: Test direct URL access with search parameters
5. **Error Handling**: Test with invalid search terms or network issues
6. **Responsive Design**: Test on different screen sizes

### API Testing
```bash
# Test search API directly
curl -X POST "http://your-base-url/api-movie/v1/search/searchVideo" \
  -H "Content-Type: application/json" \
  -d '{
    "searchName": "action",
    "categoryId": "",
    "page": 1,
    "size": 10
  }'
```

## Future Enhancements

### Planned Features
1. **Auto-suggestions**: Real-time search suggestions
2. **Search Filters**: Advanced filters (year, rating, language)
3. **Search History**: User search history storage
4. **Trending Searches**: Popular search terms display
5. **Voice Search**: Speech-to-text search input
6. **Search Analytics**: Track popular search terms

### Performance Optimizations
1. **Debounced Search**: Reduce API calls during typing
2. **Search Caching**: Cache recent search results
3. **Infinite Scroll**: Replace load more with infinite scroll
4. **Search Indexing**: Client-side search index for faster results

## Troubleshooting

### Common Issues
1. **No Results**: Check search terms and category filters
2. **API Errors**: Verify BASE_URL configuration and network connectivity
3. **Category Loading**: Ensure dashboard API loads categories properly
4. **URL Parameters**: Check URL encoding for special characters

### Debug Mode
Add console logs in search functions to debug:
```typescript
console.log('Search request:', { searchName, categoryId, page, size });
console.log('Search response:', response);
```
