# Comment Management System

A comprehensive, reusable comment management component for video and episode content with full support for replies, likes, and user interactions.

## Features

✅ **Create Comments** - Post new comments on videos or episodes
✅ **Nested Replies** - Multi-level threaded comment system
✅ **Like/Unlike** - Toggle like status on comments
✅ **Delete Comments** - Users can delete their own comments
✅ **Pagination** - Load more comments with infinite scroll support
✅ **Real-time Updates** - Optimistic UI updates for better UX
✅ **User Authentication** - Automatic token management
✅ **Responsive Design** - Mobile-friendly interface
✅ **Internationalization** - Full i18n support

## Components

### 1. CommentSection (Main Container)
The primary component that manages the comment list and pagination.

**Location:** `src/components/comment/CommentSection.tsx`

**Usage:**
```tsx
import CommentSection from '@/components/comment/CommentSection';

<CommentSection
  mediaId="507f1f77bcf86cd799439011"
  mediaType="video" // or "episode"
  className="bg-gray-900/50 rounded-lg p-6"
/>
```

**Props:**
- `mediaId` (string, required): The ID of the video or episode
- `mediaType` ('video' | 'episode', required): Type of media content
- `className` (string, optional): Additional CSS classes

### 2. CommentItem (Individual Comment)
Displays a single comment with all interaction buttons.

**Location:** `src/components/comment/CommentItem.tsx`

**Features:**
- User avatar and username
- Time ago formatting
- Like button with count
- Reply button (for top-level comments)
- Delete button (for own comments only)
- Nested replies display
- Load/hide replies toggle

### 3. CommentForm (Input Component)
Reusable form for creating comments and replies.

**Location:** `src/components/comment/CommentForm.tsx`

**Features:**
- Auto-expanding textarea
- Submit and cancel buttons
- Loading states
- Auto-focus support

## API Integration

### API Functions
**Location:** `src/lib/commentApi.ts`

#### Create Comment
```typescript
await createComment({
  mediaId: "507f1f77bcf86cd799439011",
  mediaType: "video",
  content: "Great video!",
  parentId: "optional-parent-id" // For replies
});
```

#### Get Comment List
```typescript
const result = await getCommentList(
  mediaId: "507f1f77bcf86cd799439011",
  mediaType: "video",
  page: 1,
  size: 10
);
```

#### Get Comment Replies
```typescript
const replies = await getCommentReplies(commentId);
```

#### Delete Comment
```typescript
await deleteComment(commentId);
```

#### Toggle Like
```typescript
await toggleCommentLike(commentId);
```

## Data Types

### CommentVO
```typescript
interface CommentVO {
  id: string;
  mediaId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likeCount: number;
  replyCount: number;
  parentId?: string;
  rootId?: string;
  level: number;
  mediaType: 'video' | 'episode';
  status: number;
  createdAt: string;
  updatedAt: string;
  replies?: CommentVO[];
  isLiked: boolean;
}
```

## Integration Example

### Video Player Page
```tsx
import CommentSection from '@/components/comment/CommentSection';

export default function VideoPlayer({ videoId }) {
  return (
    <div>
      {/* Video player content */}
      
      {/* Comments Section */}
      <CommentSection
        mediaId={videoId}
        mediaType="video"
        className="mt-8"
      />
    </div>
  );
}
```

### Episode Player Page
```tsx
<CommentSection
  mediaId={episodeId}
  mediaType="episode"
  className="bg-gray-900/50 rounded-lg p-6"
/>
```

## Translations

Add the following keys to your `public/locales/en/common.json`:

```json
{
  "comments": {
    "title": "Comments",
    "noComments": "No comments yet. Be the first to comment!",
    "writeComment": "Write a comment...",
    "writeReply": "Write a reply...",
    "post": "Post",
    "posting": "Posting...",
    "reply": "Reply",
    "like": "Like",
    "delete": "Delete",
    "confirmDelete": "Are you sure you want to delete this comment?",
    "showReplies": "Show replies",
    "hideReplies": "Hide replies",
    "loadingReplies": "Loading replies..."
  }
}
```

## Authentication

The comment system automatically retrieves the authentication token from `localStorage`:
- Key: `authToken`
- Format: Bearer token

Users must be logged in to:
- Post comments
- Reply to comments
- Like comments
- Delete their own comments

## Styling

The components use Tailwind CSS with the project's color scheme:
- Primary color: `#fbb033` (yellow/orange)
- Background: Gray-800/900 variants
- Text: White and gray variants

## User Permissions

### What Users Can Do:
1. **View Comments** - All users (logged in or not)
2. **Post Comments** - Logged-in users only
3. **Reply to Comments** - Logged-in users only
4. **Like Comments** - Logged-in users only
5. **Delete Comments** - Only their own comments

### Automatic Features:
- User ID validation (compares with localStorage `userId`)
- Optimistic UI updates (immediate feedback)
- Error handling with user-friendly messages
- Duplicate prevention in replies

## Performance Optimizations

1. **Pagination** - Loads 10 comments per page
2. **Lazy Loading** - Replies loaded on demand
3. **Optimistic Updates** - UI updates before API confirmation
4. **Local State Management** - Reduces API calls

## Error Handling

All API functions include comprehensive error handling:
- Network errors
- Authentication errors
- Validation errors
- Server errors

Errors are displayed to users with clear messages.

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for forms

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-friendly interface

## Future Enhancements

Potential improvements:
- Real-time updates via WebSockets
- Comment editing functionality
- Report/flag inappropriate comments
- Rich text formatting
- @ mentions
- Emoji reactions
- Image attachments
- Comment sorting options

## Troubleshooting

### Comments not loading
1. Check if `mediaId` is valid
2. Verify API endpoint is accessible
3. Check authentication token in localStorage

### Can't post comments
1. Ensure user is logged in
2. Verify `authToken` exists in localStorage
3. Check network tab for API errors

### Likes not working
1. Verify user authentication
2. Check for API errors in console
3. Ensure `commentId` is valid

## API Endpoints

- **Create**: `POST /api-movie/v1/comments/create`
- **List**: `GET /api-movie/v1/comments/list`
- **Replies**: `GET /api-movie/v1/comments/replies`
- **Delete**: `DELETE /api-movie/v1/comments/delete`
- **Like**: `POST /api-movie/v1/comments/like`

## License

Part of the OTalk TV project.
