# Category Videos API Implementation

## Overview
This document outlines the implementation of the category videos API for fetching videos based on category ID with pagination support.

## API Endpoint
- **URL**: `/api-movie/v1/category/videos/{categoryId}`
- **Method**: `GET`
- **Content-Type**: `application/x-www-form-urlencoded`

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | string (path) | Yes | Category ID to fetch videos for |
| page | integer | Yes | Page number (starts from 0) |
| size | integer | Yes | Number of items per page |

## Response Structure
```typescript
interface VideosApiResponse {
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
- `VideoVO`: Video object structure from API
- `PageInfo`: Pagination information
- `VideosApiResponse`: Complete API response type
- `ErrorDetail` & `ValidationError`: Error handling types

### 2. API Function (`src/lib/movieApi.ts`)
```typescript
export async function getCategoryVideos(
  categoryId: string, 
  page: number = 0, 
  size: number = 20
): Promise<VideosApiResponse | null>
```

### 3. Category Videos Component (`src/components/movie/CategoryVideos.tsx`)
**Features:**
- ✅ Data fetching with loading states
- ✅ Error handling with retry functionality
- ✅ Pagination with page numbers and load more
- ✅ Responsive grid layout (1-5 columns based on screen size)
- ✅ Fallback images for failed loads (alternating between two images)
- ✅ Video metadata display (year, rating, region, language, series indicator)
- ✅ Search result count display

### 4. Category Page (`src/app/category/[id]/page.tsx`)
- Server-side category name resolution from dashboard
- Client-side video fetching and display
- Proper metadata generation for SEO

## Features

### Video Card Display
Each video shows:
- **Poster Image**: Custom cover or fallback images
- **Title**: Video title with line clamping
- **Description**: Truncated description
- **Year Badge**: Release year in top-right corner
- **Rating Badge**: Star rating in bottom-left corner
- **Metadata Tags**: Region, language, series indicator

### Pagination
- **Load More Button**: Append new videos to current list
- **Page Navigation**: Traditional pagination with page numbers
- **Page Info**: Shows current page, total pages, and total videos
- **Smooth Scrolling**: Auto-scroll to top on page change

### Error Handling
- Network error handling with retry option
- API error message display
- Graceful degradation for missing data
- Fallback images for broken poster URLs

### Performance Optimizations
- **useCallback**: Memoized fetch function
- **Proper Dependencies**: React hooks with correct dependency arrays
- **Image Fallbacks**: Alternating placeholder images
- **Responsive Design**: Optimized for all screen sizes

## Usage

### Navigation
Users can access category pages through:
1. **Sidebar**: Click on category items in navigation
2. **Direct URL**: `/category/{categoryId}`
3. **Dashboard Links**: From homepage category sections

### URL Structure
```
/category/1  -> Shows videos for category ID 1
/category/2  -> Shows videos for category ID 2
```

### Query Parameters (handled internally)
```
/api-movie/v1/category/videos/1?page=0&size=20
/api-movie/v1/category/videos/1?page=1&size=20
```

## Testing

### Manual Testing
1. **Navigate to category page**: Visit `/category/{id}` with valid category ID
2. **Test pagination**: Click page numbers and load more button
3. **Test error states**: Use invalid category ID or network issues
4. **Test responsive design**: Check layout on different screen sizes
5. **Test image fallbacks**: Check poster images load correctly

### API Testing
```bash
# Test category videos API directly
curl "http://your-base-url/api-movie/v1/category/videos/1?page=0&size=20"
```

### Debug Mode
Add console logs in `getCategoryVideos` function to debug API responses:
```typescript
console.log('Category videos response:', response.data);
```

## Configuration

### Page Size
Default: 20 videos per page
- Can be modified in `CategoryVideos.tsx`
- Consider API performance for larger page sizes

### Fallback Images
Located in `/public/fallback_poster/`:
- `sample_poster.png`
- `sample_poster1.png`

### Grid Layout
Responsive breakpoints:
- Mobile: 1 column
- Small: 2 columns  
- Medium: 3 columns
- Large: 4 columns
- XL: 5 columns

## Future Enhancements

### Potential Improvements
1. **Infinite Scroll**: Replace pagination with infinite scroll
2. **Filtering**: Add filters for year, rating, region
3. **Sorting**: Allow sorting by title, year, rating
4. **Search Within Category**: Add search functionality
5. **Video Preview**: Hover preview or modal popup
6. **Favorites**: Add to favorites functionality
7. **Caching**: Implement API response caching

### Performance Optimizations
1. **Virtual Scrolling**: For very large lists
2. **Image Lazy Loading**: Load images as they come into view
3. **API Caching**: Cache responses in localStorage/sessionStorage
4. **Skeleton Loading**: Better loading states

## Troubleshooting

### Common Issues
1. **Empty Category**: Check if category ID exists and has videos
2. **API Errors**: Verify BASE_URL configuration in `src/config/index.ts`
3. **Network Issues**: Check browser network tab for failed requests
4. **Build Errors**: Ensure all TypeScript types are properly imported

### Debug Steps
1. Check browser console for error messages
2. Verify API endpoint accessibility
3. Test with different category IDs
4. Check network requests in browser dev tools
