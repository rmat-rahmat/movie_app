# OtalkTV - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Directory Structure](#directory-structure)
5. [Core Components](#core-components)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Video Player System](#video-player-system)
9. [Upload System](#upload-system)
10. [Authentication & Authorization](#authentication--authorization)
11. [Internationalization (i18n)](#internationalization-i18n)
12. [Routing & Navigation](#routing--navigation)
13. [Data Flow](#data-flow)
14. [Development Guidelines](#development-guidelines)
15. [Deployment](#deployment)
16. [Troubleshooting](#troubleshooting)

---

## Project Overview

**OtalkTV** is a Next.js-based video streaming platform that supports:
- Movie and series uploads with multiple quality options
- HLS video streaming with adaptive bitrate
- User authentication and authorization
- Multi-language support (i18n)
- Comments, likes, favorites, and sharing
- Category-based content organization
- Banner management and recommendations

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video Streaming**: HLS.js
- **State Management**: Zustand
- **Internationalization**: i18next
- **API Client**: Axios
- **Video Upload**: Custom chunked upload system

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Next.js App Router (SSR/CSR)              │  │
│  │                                                        │  │
│  │  Pages → Components → API Clients → Backend APIs     │  │
│  │                                                        │  │
│  │  Zustand Stores (State Management)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api-movie/*  - Content & Metadata APIs             │  │
│  │  /api-net/*    - Video Streaming & Upload APIs       │  │
│  │  /api-user/*   - Authentication & User Management    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Storage & CDN                             │
│  - Video Storage (HLS segments)                             │
│  - Image Storage (covers, thumbnails)                       │
│  - User Data & Metadata                                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App
├── Layout (Header, Footer, Auth)
├── Pages
│   ├── Home (Dashboard sections, banners)
│   ├── VideoPlayer (HLS streaming)
│   ├── VideoPlayerExternal (iframe embedding)
│   ├── Upload (Movie/Series upload)
│   ├── Profile (User management)
│   ├── Category (Filtered content)
│   └── Search (Content discovery)
├── Components
│   ├── movie/ (Content display)
│   ├── ui/ (Reusable UI elements)
│   ├── comment/ (Comments system)
│   └── subscription/ (Premium features)
└── Stores
    ├── authStore (User authentication)
    ├── videoStore (Video metadata)
    └── categoryStore (Categories cache)
```

---

## Key Features

### 1. Video Streaming
- **HLS Adaptive Streaming**: Multiple quality levels (360p, 480p, 720p, 1080p)
- **Quality Permissions**: Server-controlled quality access based on user tier
- **Resume Playback**: Remembers watch position
- **Watch History**: Tracks viewing progress
- **External Sources**: Support for external video URLs

### 2. Content Management
- **Upload System**: Chunked file upload with progress tracking
- **Metadata Management**: Title, description, tags, actors, directors
- **Category Organization**: Hierarchical category tree
- **Series Support**: Multi-episode management
- **Quality Variants**: Automatic quality generation

### 3. User Engagement
- **Likes & Favorites**: Save and like content
- **Comments**: Nested comment threads
- **Shares**: Share videos with encrypted URLs
- **Recommendations**: Personalized content suggestions
- **Watch History**: Track viewing patterns

### 4. Internationalization
- **Multi-language Support**: English, Chinese, Malay, German, French, Russian
- **Dynamic Translation**: Category names, UI elements
- **Language Persistence**: User language preference saved

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Homepage with sections
│   ├── videoplayer/             # Internal video player
│   │   └── VideoPlayerClient.tsx
│   ├── videoplayerExternal/     # External video player
│   │   └── VideoPlayerExternal.tsx
│   ├── upload/                  # Content upload
│   │   ├── MovieUpload.tsx
│   │   └── SeriesUpload.tsx
│   ├── profile/                 # User profile pages
│   │   ├── likes/
│   │   ├── shares/
│   │   └── favorites/
│   ├── category/                # Category pages
│   ├── search/                  # Search functionality
│   └── settings/                # User settings
│
├── components/                   # Reusable components
│   ├── movie/                   # Movie/video components
│   │   ├── BannerSlider.tsx    # Homepage banner carousel
│   │   ├── DashboardItem.tsx   # Video card component
│   │   ├── DashboardSection.tsx # Horizontal scrolling section
│   │   ├── GridVideos.tsx      # Grid layout with pagination
│   │   ├── MovieModal.tsx      # Video detail modal
│   │   └── RecommendationGrid.tsx # Recommendations
│   ├── ui/                      # Generic UI components
│   │   ├── LoadingPage.tsx
│   │   ├── StarRating.tsx
│   │   ├── TagSelector.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── DurationInput.tsx
│   │   ├── SearchableDropdown.tsx
│   │   └── UploadSuccessModal.tsx
│   ├── comment/                 # Comment system
│   │   └── CommentSection.tsx
│   ├── i18n/                    # Internationalization
│   │   └── LanguageSwitcher.tsx
│   └── subscription/            # Premium features
│       └── SubscriptionSection.tsx
│
├── lib/                         # API clients and utilities
│   ├── movieApi.ts             # Content & metadata APIs
│   ├── uploadAPI.ts            # Upload & storage APIs
│   ├── tagAPI.ts               # Tag management
│   └── commentApi.ts           # Comment APIs
│
├── store/                       # Zustand state stores
│   ├── authStore.ts            # User authentication state
│   ├── videoStore.ts           # Current video state
│   └── categoryStore.ts        # Categories cache
│
├── utils/                       # Utility functions
│   ├── urlEncryption.ts        # URL encryption/decryption
│   ├── durationUtils.ts        # Time formatting
│   └── categoryUtils.ts        # Category helpers
│
├── types/                       # TypeScript type definitions
│   └── Dashboard.ts            # Main type definitions
│
└── config.ts                    # Configuration constants
```

---

## Core Components

### 1. VideoPlayerClient (`src/app/videoplayer/VideoPlayerClient.tsx`)

**Purpose**: Main video player for HLS streaming with quality selection

**Key Features**:
- HLS.js integration for adaptive streaming
- Quality selection with permission checks
- Resume playback from last position
- Watch history tracking
- Episode navigation for series
- Interaction buttons (like, favorite, share, comments)
- Accordion for additional info

**Props**:
```typescript
interface VideoPlayerClientProps {
  id?: string;  // Video upload ID
}
```

**URL Parameters**:
- `id`: Upload ID for direct playback
- `m3u8`: Direct M3U8 URL
- `mediaid`: Media ID for tracking
- `directid`: Content ID that needs resolution
- `self`: Owner flag for full quality access

**State Management**:
```typescript
// Quality control
const [availableQualities, setAvailableQualities] = useState<string[]>([]);
const [filteredQuality, setFilteredQuality] = useState<QualityPermission[]>([]);
const [currentlyPlayingQuality, setCurrentlyPlayingQuality] = useState<number>(-1);

// Playback state
const [isPlaying, setIsPlaying] = useState(false);
const [calcDuration, setCalcDuration] = useState<number>(0);
const [tOffset, setTOffset] = useState<number>(0);

// User interactions
const [isFavorited, setIsFavorited] = useState(false);
const [isLiked, setIsLiked] = useState(false);
const [commentCount, setCommentCount] = useState(0);
```

**HLS Implementation**:
```typescript
// Master playlist generation
const masterPlaylist = `
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080
${BASE_URL}/api-net/play/${uploadId}/1080p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
${BASE_URL}/api-net/play/${uploadId}/720p.m3u8
`;

// HLS.js setup
const hls = new Hls();
hls.loadSource(masterUrl);
hls.attachMedia(videoElement);
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  videoElement.play();
});
```

**Quality Permission Logic**:
```typescript
// Check if user can access quality
if (owner === "true") {
  permitted = true; // Owner has full access
} else if (qualityPermissions) {
  permitted = qualityPermissions.find(
    qp => qp.qualityName === quality && qp.status === "ALLOW"
  );
} else {
  permitted = await getPlaybackUrl(uploadId, quality) !== null;
}
```

### 2. VideoPlayerExternal (`src/app/videoplayerExternal/VideoPlayerExternal.tsx`)

**Purpose**: Player for external video sources (iframe embedding)

**Key Features**:
- Encrypted URL handling
- Ad-blocking CSS injection
- Fullscreen support
- Same interaction features as internal player

**URL Encryption**:
```typescript
// Encrypt external URL
const encryptedUrl = encryptUrl(externalUrl);
router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);

// Decrypt on load
const decryptedUrl = decryptUrl(encryptedUrl);
setExternalUrl(decryptedUrl);
```

### 3. BannerSlider (`src/components/movie/BannerSlider.tsx`)

**Purpose**: Homepage hero banner carousel

**Features**:
- Auto-rotation every 5 seconds
- Touch/swipe gesture support
- Desktop/mobile image variants
- Click-through navigation (internal/external links)

**Banner Types**:
```typescript
interface BannerVO {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;      // Desktop banner
  mobileImageUrl?: string; // Mobile banner
  avatarUrl?: string;
  linkType: 1 | 2;       // 1: Internal, 2: External
  videoId?: string;      // For internal links
  externalUrl?: string;  // For external links
}
```

### 4. DashboardSection (`src/components/movie/DashboardSection.tsx`)

**Purpose**: Horizontal scrolling section for video cards

**Features**:
- Infinite horizontal scroll
- Load more on scroll end
- Responsive grid (1-7 items visible)
- View more button

**Scroll Handling**:
```typescript
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
  const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
  
  if (scrollPercentage > 0.9 && !isLoadingMore) {
    onScrollEnd?.(); // Trigger load more
  }
};
```

### 5. GridVideos (`src/components/movie/GridVideos.tsx`)

**Purpose**: Grid layout with pagination and date grouping

**Features**:
- Desktop pagination
- Mobile infinite scroll
- Date grouping (today, yesterday, last 5 days, week, month, year)
- List/grid view toggle

**Date Grouping Logic**:
```typescript
const groupedVideos = useMemo(() => {
  if (groupBy !== 'date') return { none: videos };
  
  const groups: Record<string, VideoVO[]> = {
    today: [],
    yesterday: [],
    day3: [], day4: [], day5: [], day6: [], day7: [],
    thisWeek: [],
    thisMonth: [],
    thisYear: [],
    older: []
  };
  
  videos.forEach(video => {
    const videoDate = new Date(video.createTime);
    const diffDays = Math.floor((today - videoDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) groups.today.push(video);
    else if (diffDays === 1) groups.yesterday.push(video);
    // ...more grouping logic
  });
  
  return groups;
}, [videos, groupBy]);
```

### 6. MovieUpload & SeriesUpload (`src/app/upload/`)

**Purpose**: Content upload with metadata management

**Upload Flow**:
1. Select video file or provide M3U8 URL
2. Preview video and set duration
3. Fill metadata (title, description, category, tags, actors, etc.)
4. Upload cover image (portrait) and landscape thumbnail
5. Chunked file upload with progress tracking
6. Success modal with options to upload more or go home

**Chunked Upload**:
```typescript
const chunkSize = 10 * 1024 * 1024; // 10MB chunks
const totalChunks = Math.ceil(file.size / chunkSize);

// Create upload credential
const credential = await createMovieUpload({
  title, description, categoryId,
  fileName, fileSize,
  totalParts: totalChunks
});

// Upload file in chunks
await uploadFile(file, credential, (progress) => {
  setUploadProgress(10 + (progress * 0.9));
});
```

---

## API Integration

### API Structure

All APIs are organized in `src/lib/`:

#### 1. movieApi.ts - Content & Metadata
```typescript
// Home sections
getHomeSections(categoryId?, imageQuality?, limit?, language?)

// Category management
getCategoryTree()
getCachedCategories()

// Content details
getContentDetail(id, self?)
getVideoRecommendations(videoId, page, pageSize)

// User interactions
toggleFavorite(mediaId)
toggleVideoLike(mediaId)
checkFavorite(mediaId)
checkVideoLike(mediaId)

// Watch history
recordWatchHistory(dto)
getLastWatchPosition(mediaId, episodeId)

// Pagination
loadMoreSectionContent(sectionId, categoryId, imageQuality, page, pageSize)
```

#### 2. uploadAPI.ts - Upload & Storage
```typescript
// Movie upload
createMovieUpload(request: MovieUploadRequest)
uploadFile(file, credential, onProgress)

// Series upload
createSeriesUpload(request: SeriesUploadRequest)
addEpisodeToSeries(seriesId, episode)

// Image upload
initializeImageUpload(request)
directImageUpload(file, folder, permission, size)
getImageById(id, quality)
```

#### 3. commentApi.ts - Comments
```typescript
getComments(mediaId, mediaType, page, pageSize)
addComment(mediaId, mediaType, content, parentId?)
deleteComment(commentId)
```

### API Response Types

```typescript
// Standard API response
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// Video object
interface VideoVO {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  imageQuality?: { url: string; quality: string };
  isSeries: boolean;
  rating?: number;
  views?: number;
  year?: number;
  // ...more fields
}

// Home section
interface HomeSectionVO {
  id: string;
  title: string;
  contents: VideoVO[];
  hasMore: boolean;
  categoryId?: string;
}
```

---

## State Management

### Zustand Stores

#### 1. authStore (`src/store/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

// Usage
const { user, login, logout } = useAuthStore();
```

#### 2. videoStore (`src/store/videoStore.ts`)

```typescript
interface VideoState {
  currentVideo: VideoDetails | null;
  
  // Actions
  setCurrentEpisode: (episodeId: string) => void;
  setVideoFromDetails: (details: VideoDetails, uploadId: string) => void;
  clearCurrentVideo: () => void;
}

// Usage
const { currentVideo, setCurrentEpisode } = useVideoStore();
```

### State Persistence

```typescript
// LocalStorage persistence
const authStore = create(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## Video Player System

### Quality Management

#### Quality Levels
- **360p**: 640x360, 800 kbps (mobile fallback)
- **480p**: 854x480, 1.5 Mbps
- **720p**: 1280x720, 1.5 Mbps (default)
- **1080p**: 1920x1080, 3 Mbps (premium)

#### Permission System
```typescript
interface QualityPermission {
  qualityName: string;   // "360P", "720P", etc.
  status: "ALLOW" | "DENY" | "REQUIRE_LOGIN";
}

// Check permission before quality switch
if (status === "ALLOW") {
  hls.currentLevel = qualityIndex;
} else if (status === "REQUIRE_LOGIN") {
  router.push('/login');
} else {
  alert('You do not have permission');
}
```

### Resume Playback

```typescript
// Fetch last watch position
const lastPos = await getLastWatchPosition(mediaId, episodeId);

// Account for timestamp offset
const seekTarget = lastPos + tOffset;

// Seek to position
videoElement.currentTime = Math.min(seekTarget, duration - 1);
```

### Watch History Tracking

```typescript
// Track watch time every second
setInterval(() => {
  sessionWatchTimeRef.current += 1;
}, 1000);

// Send record on pause/end/unload
const sendRecord = async () => {
  await recordWatchHistory({
    mediaId,
    episodeId,
    watchTime: sessionWatchTime,
    duration,
    progress: currentTime,
    source: 'web'
  });
};
```

---

## Upload System

### Upload Types

#### 1. File Upload (Internal Hosting)
- Chunked upload for large files
- Progress tracking
- Automatic quality generation
- Resume support

#### 2. M3U8 URL (External Hosting)
- Direct M3U8 playlist URL
- No storage on server
- Immediate availability

#### 3. Play URL (iframe Embedding)
- External video page URL
- Ad-blocking support
- Encrypted URL sharing

### Upload Request Structure

```typescript
interface MovieUploadRequest {
  title: string;
  uploadType: 'FILE_UPLOAD' | 'M3U8_URL';
  
  // For FILE_UPLOAD
  fileName?: string;
  fileSize?: number;
  totalParts?: number;
  
  // For M3U8_URL
  m3u8Url?: string;
  
  // Common metadata
  description?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  landscapeThumbnailUrl?: string;
  duration: number;  // milliseconds
  categoryId: string;
  year: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;  // Format: /Actor1/Actor2/Actor3
  rating?: number;  // 0-10
  tags?: string[];
  releaseRegions?: string;
  sourceProvider?: string;
}
```

### Series Upload

```typescript
// 1. Create series
const seriesId = await createSeriesUpload({
  title: "Series Title",
  description: "...",
  totalEpisodes: 10,
  // ...metadata
});

// 2. Add episodes
for (const episode of episodes) {
  await addEpisodeToSeries(seriesId, {
    episodeNumber: episode.number,
    episodeTitle: episode.title,
    uploadType: episode.type,
    fileName: episode.file?.name,
    // ...episode data
  });
}
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ├─→ POST /api-user/login
       │
       ├─→ Receive JWT token
       │
       ├─→ Store in authStore + localStorage
       │
       └─→ Set axios default header
```

### Token Management

```typescript
// Set token after login
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Check auth on app load
useEffect(() => {
  checkAuth();
}, []);

// Auto-logout on 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      logout();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);
```

### Protected Routes

```typescript
// In page component
const { user } = useAuthStore();

useEffect(() => {
  if (!user) {
    router.push('/login');
  }
}, [user]);
```

### Permission Checks

```typescript
// Check if user owns content
const isOwner = user?.id === content.createBy;

// Check subscription tier
const hasPremium = user?.subscriptionTier === 'premium';

// Quality access
if (qualityPermission.status === "REQUIRE_LOGIN" && !user) {
  router.push('/login');
}
```

---

## Internationalization (i18n)

### Setup

```typescript
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enTranslations },
      zh: { common: zhTranslations },
      // ...more languages
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
```

### Translation Files

```
public/locales/
├── en/
│   └── common.json
├── zh/
│   └── common.json
├── ms/
│   └── common.json
└── ...
```

### Usage

```typescript
// In components
const { t } = useTranslation('common');

<h1>{t('home.welcome', 'Welcome')}</h1>
<p>{t('home.videoCount', 'Showing {{count}} videos', { count: 10 })}</p>
```

### Category Localization

```typescript
// Categories have multi-language labels
interface CategoryItem {
  id: string;
  categoryLangLabel: {
    en: string;
    zh: string;
    ms: string;
    // ...
  };
}

// Get localized name
const getLocalizedCategoryName = (category: CategoryItem) => {
  const currentLang = i18n.language;
  return category.categoryLangLabel?.[currentLang] 
    || category.categoryName 
    || category.categoryAlias 
    || category.id;
};
```

---

## Routing & Navigation

### Route Structure

```
/                          # Homepage
/videoplayer?id=X          # Internal video player
/videoplayer?m3u8=X        # M3U8 URL player
/videoplayer?directid=X    # Content ID (needs resolution)
/videoplayerExternal?url=X # External player
/upload                    # Upload page (movie/series)
/category/:categoryId      # Category page
/search?q=X                # Search results
/profile                   # User profile
/profile/likes             # Liked videos
/profile/shares            # Shared videos
/profile/favorites         # Favorite videos
/settings                  # User settings
/login                     # Login page
/register                  # Registration
```

### Navigation Helpers

```typescript
// Navigate to video player
router.push(`/videoplayer?directid=${videoId}`);

// Navigate with episode
router.push(`/videoplayer?id=${uploadId}`);

// External video
const encryptedUrl = encryptUrl(playUrl);
router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);

// Category filtering
router.push(`/category/${categoryId}`);
```

---

## Data Flow

### Homepage Data Flow

```
1. Page Load
   └─→ initializePage()
       ├─→ fetchCategories()
       │   └─→ getCategoryTree() → setCategoryList()
       │
       ├─→ fetchBanners()
       │   └─→ getBannerList() → setBanners()
       │
       └─→ fetchHomeSections()
           └─→ getHomeSections() → setSections()

2. Category Change
   └─→ handleCategoryChange(categoryId)
       └─→ fetchHomeSections(categoryId)

3. Load More (horizontal scroll)
   └─→ onScrollEnd()
       └─→ loadMoreForSection(sectionId)
           └─→ loadMoreSectionContent() → append videos
```

### Video Player Data Flow

```
1. URL Parsing
   └─→ searchParams.get('directid')

2. Fetch Content Details
   └─→ getContentDetail(directId)
       └─→ setVideoFromDetails()

3. Resolve Episode
   ├─→ If m3u8Url: router.replace('/videoplayer?m3u8=...')
   ├─→ If uploadId: continue with uploadId
   └─→ If playUrl: router.push('/videoplayerExternal?url=...')

4. Load Video
   └─→ getPlayMain(uploadId)
       └─→ Build master playlist
           └─→ loadFromMaster()
               ├─→ HLS.js initialization
               ├─→ Resume playback
               └─→ Start watch tracking

5. User Interactions
   ├─→ toggleLike() → updateUI
   ├─→ toggleFavorite() → updateUI
   └─→ Episode click → navigate to new episode
```

### Upload Data Flow

```
1. File Selection
   └─→ handleFileSelect()
       └─→ Preview + set duration

2. Cover Upload
   └─→ handleCoverFileSelect()
       └─→ initializeImageUpload()
           └─→ uploadFile()

3. Submit
   └─→ handleMovieUpload()
       ├─→ Upload cover (if selected)
       ├─→ createMovieUpload() → get credential
       ├─→ uploadFile() with progress
       └─→ Show success modal

4. Success
   └─→ UploadSuccessModal
       ├─→ Upload More → reset form
       └─→ Go Home → navigate to '/'
```

---

## Development Guidelines

### Code Style

#### TypeScript
- Use explicit types for all function parameters and return values
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values

```typescript
// Good
interface VideoProps {
  video: VideoVO;
  onPlay: (id: string) => void;
}

// Avoid
const VideoCard = (props: any) => { ... }
```

#### React Components
- Use functional components with hooks
- Destructure props in function signature
- Use `React.FC` for component types

```typescript
const VideoCard: React.FC<VideoProps> = ({ video, onPlay }) => {
  // Component logic
};
```

#### State Management
- Use Zustand for global state
- Use `useState` for component-local state
- Use `useRef` for non-reactive values

```typescript
// Global state
const { user, login } = useAuthStore();

// Local state
const [isPlaying, setIsPlaying] = useState(false);

// Refs
const videoRef = useRef<HTMLVideoElement>(null);
```

### API Client Patterns

#### Standard API Call
```typescript
export async function getVideoDetails(id: string): Promise<VideoVO | null> {
  try {
    const response = await axios.get(`/api-movie/v1/content/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch video details:', error);
    return null;
  }
}
```

#### With Error Handling
```typescript
export async function toggleLike(mediaId: string): Promise<ToggleResult> {
  try {
    const response = await axios.post(`/api-movie/v1/like/${mediaId}/toggle`);
    return {
      success: response.data.success,
      message: response.data.message,
      isLiked: response.data.data?.isLiked ?? false
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      isLiked: false
    };
  }
}
```

### Component Patterns

#### Loading State
```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSomeData();
      setData(data);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);

if (isLoading) return <LoadingPage />;
```

#### Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);
  try {
    await someAsyncAction();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  }
};

{error && <div className="text-red-400">{error}</div>}
```

### Performance Optimization

#### Memoization
```typescript
// Expensive computation
const groupedVideos = useMemo(() => {
  return videos.reduce((groups, video) => {
    // grouping logic
  }, {});
}, [videos]);

// Callback functions
const handleClick = useCallback((id: string) => {
  // handler logic
}, [dependency]);
```

#### Lazy Loading
```typescript
// Component lazy loading
const VideoPlayer = lazy(() => import('./VideoPlayer'));

// Image lazy loading
<Image 
  src={imageUrl} 
  loading="lazy" 
  placeholder="blur"
/>
```

---

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build

# Start production server
npm start

# Static export (if needed)
npm run build && npm run export
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.OtalkTV.com
NEXT_PUBLIC_UPLOAD_API_URL=https://upload.OtalkTV.com
UPLOAD_API_KEY=your_api_key_here
```

### Deployment Checklist

- [ ] Set all environment variables
- [ ] Build and test production bundle
- [ ] Verify API endpoints are accessible
- [ ] Test video playback on production domain
- [ ] Verify CORS settings
- [ ] Enable CDN caching for static assets
- [ ] Set up monitoring and error tracking
- [ ] Configure SSL certificates
- [ ] Test on multiple devices and browsers

### Performance Tips

1. **Image Optimization**
   - Use Next.js Image component
   - Serve images from CDN
   - Use appropriate sizes (360, 720, 1080)

2. **Video Optimization**
   - Use HLS adaptive streaming
   - Implement quality selection
   - Cache M3U8 playlists

3. **Code Splitting**
   - Lazy load heavy components
   - Use dynamic imports for modals
   - Split vendor bundles

4. **Caching Strategy**
   - Cache categories and tags locally
   - Use SWR for data fetching
   - Implement browser caching headers

---

## Troubleshooting

### Common Issues

#### 1. Video Not Playing

**Symptoms**: Black screen, loading indefinitely

**Solutions**:
- Check if HLS.js is supported: `Hls.isSupported()`
- Verify M3U8 URL is accessible
- Check CORS headers on video server
- Ensure quality permissions are set correctly
- Check browser console for HLS errors

```typescript
hls.on(Hls.Events.ERROR, (event, data) => {
  console.error('HLS Error:', data);
  if (data.fatal) {
    // Handle fatal errors
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        console.error('Network error');
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.error('Media error');
        hls.recoverMediaError();
        break;
      default:
        hls.destroy();
        break;
    }
  }
});
```

#### 2. Upload Failing

**Symptoms**: Upload progress stops, error messages

**Solutions**:
- Check file size limits (max 10GB)
- Verify API key is set correctly
- Ensure chunked upload is working
- Check network connectivity
- Verify storage quota

```typescript
// Debug upload
const uploadFile = async (file, credential, onProgress) => {
  console.log('Starting upload:', {
    fileName: file.name,
    fileSize: file.size,
    totalChunks: Math.ceil(file.size / chunkSize)
  });
  
  try {
    // Upload logic with detailed logging
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

#### 3. Authentication Issues

**Symptoms**: 401 errors, logged out unexpectedly

**Solutions**:
- Check if token is stored correctly
- Verify token expiration
- Ensure axios interceptor is set up
- Check API endpoint authentication

```typescript
// Debug auth
const checkAuth = async () => {
  const token = localStorage.getItem('auth-token');
  console.log('Token exists:', !!token);
  
  try {
    const response = await axios.get('/api-user/me');
    console.log('Auth check successful:', response.data);
  } catch (error) {
    console.error('Auth check failed:', error);
    // Clear invalid token
    logout();
  }
};
```

#### 4. i18n Not Working

**Symptoms**: Keys showing instead of translations, language not switching

**Solutions**:
- Verify translation files exist
- Check i18n initialization
- Ensure language code is correct
- Verify translation keys match

```typescript
// Debug i18n
console.log('Current language:', i18n.language);
console.log('Available languages:', i18n.languages);
console.log('Translation exists:', i18n.exists('common:home.welcome'));
console.log('Translation value:', t('home.welcome'));
```

### Debugging Tools

#### Console Logging
```typescript
// Add debug logs for data flow
console.log('[VideoPlayer] Loading video:', { id, uploadId });
console.log('[API] Request:', { url, params });
console.log('[Store] State updated:', { user, currentVideo });
```

#### React DevTools
- Inspect component hierarchy
- Check component props and state
- Profile performance issues

#### Network Tab
- Monitor API requests
- Check response times
- Verify request/response format
- Check for failed requests

---

## Future Enhancements

### Planned Features

1. **Enhanced Recommendations**
   - ML-based personalization
   - Collaborative filtering
   - Trending content detection

2. **Social Features**
   - User profiles and following
   - Activity feed
   - Social sharing integrations

3. **Advanced Analytics**
   - Watch time analytics
   - Engagement metrics
   - Content performance dashboard

4. **Mobile Apps**
   - React Native iOS/Android apps
   - Offline download support
   - Push notifications

5. **Live Streaming**
   - Real-time HLS streaming
   - Chat integration
   - DVR functionality

### Technical Improvements

1. **Performance**
   - Implement service workers
   - Add progressive web app (PWA) support
   - Optimize bundle size further

2. **Testing**
   - Add unit tests with Jest
   - Integration tests with Playwright
   - E2E testing suite

3. **DevOps**
   - CI/CD pipeline setup
   - Automated deployment
   - Staging environment

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (Lighthouse CI)
   - User analytics (Google Analytics)

---

## Additional Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [i18next Documentation](https://www.i18next.com/)

### API Documentation
- `/api-movie/*` - Content & metadata endpoints
- `/api-net/*` - Video streaming & upload endpoints
- `/api-user/*` - User authentication & management

### Contact
For questions or support, contact the development team at: dev@OtalkTV.com

---

## Version History

### v1.0.0 (Current)
- Initial release with core features
- Movie and series upload
- HLS video streaming
- User authentication
- Multi-language support
- Comments and interactions

---

**Last Updated**: December 2024  
**Maintainer**: OtalkTV Development Team
