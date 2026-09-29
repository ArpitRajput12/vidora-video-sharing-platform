# Vidora Frontend — Architecture & Implementation Plan

This plan outlines the frontend architecture, state management, routing design, component hierarchy, and API integration for the **Vidora** Video Sharing Platform.

---

## 1. Tech Stack & Dependencies

- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios (configured with `withCredentials: true`, interceptors, and token refresh queue)
- **Icons**: Lucide React
- **Media Player & Drag-and-Drop**: Custom HTML5 / React Video Player controls & native or dropzone file handlers.

---

## 2. Design System & Visual Tokens

The user interface will strictly reproduce the **Sleek SaaS Dark Mode Aesthetic** matching the 9-screen reference layout:

| Token | Hex Value | Application |
|---|---|---|
| **Primary Canvas** | `#0F172A` | Global background (`slate-900` / deep slate navy) |
| **Surface / Card Background** | `#111827` / `#162033` | Navbars, sidebars, cards, and modal sheets |
| **Surface Hover / Highlight** | `#1E293B` | Active menu states, list hover rows |
| **Borders & Separators** | `#1E293B` / `#334155` | Subtle 1px borders on cards, dividers, inputs |
| **Primary Accent** | `#3B82F6` | Vibrant blue for primary CTAs, active indicators, progress bars |
| **Secondary Accents** | `#6366F1` / `#8B5CF6` | Indigo & purple badges, gradients for stats & tags |
| **Success / Danger** | `#10B981` / `#EF4444` | Metric gains (+%), error states, delete triggers |
| **Text Primary** | `#F8FAFC` | Headings, video titles, primary text |
| **Text Secondary / Muted** | `#94A3B8` / `#64748B` | Subtitles, timestamps, view counts, descriptions |
| **Border Radii** | `8px–12px` (Buttons), `12px–16px` (Cards, Modals) | Modern compact rounded edges |

---

## 3. State Management & Axios Interceptor Architecture

### 3.1 Authentication & User Context (`AuthContext`)
- **State Properties**:
  - `user`: Authenticated user object (`_id`, `username`, `fullName`, `avatar`, `coverImage`, etc.)
  - `isAuthenticated`: Boolean
  - `isLoading`: Boolean (initial check via `/api/v1/users/current-user`)
  - `login(credentials)`: Calls `/api/v1/users/login`, stores accessToken in memory/storage, updates user state.
  - `register(formData)`: Calls `/api/v1/users/register`.
  - `logout()`: Calls `/api/v1/users/logout`, clears tokens and user state, redirects to `/login`.
  - `updateUserProfile(data)`: Updates local user state dynamically on profile or avatar edits.

### 3.2 Centralized Axios Client (`api/client.js`)
- Configured with:
  ```javascript
  baseURL: "/api/v1" // Proxied via Vite to http://127.0.0.1:8000
  withCredentials: true
  ```
- **Dual Token Handling**:
  - Request Interceptor: Automatically attaches `Authorization: Bearer <accessToken>` if token exists in memory/storage.
  - Response Interceptor:
    1. Intercepts `401 Unauthorized` responses.
    2. Detects if the request is already a retry (`_retry`).
    3. Queues concurrent failed requests while a single refresh token call is dispatched to `/api/v1/users/refresh-token`.
    4. Upon successful refresh, resolves all queued requests with the fresh token.
    5. If refresh fails, clears session and redirects to `/login`.

---

## 4. Routing Structure & Protected Layouts

All routes map directly to backend API controllers:

```
/                         -> Redirects to /studio (or /watch if public)
/login                    -> Login Page (public)
/register                 -> Register Page (public, supports avatar & cover upload)

(Protected within RootLayout with Sidebar + TopNavbar):
├── /studio               -> 1. Channel Dashboard & Studio (/dashboard/stats + /dashboard/videos)
├── /watch/:videoId       -> 2. Video Watch Page (/videos/:id + /comments + /likes + /subscriptions)
├── /my-videos            -> 3. Video Management Grid/Table (/dashboard/videos, toggle publish, delete)
├── /community            -> 4. Community / Tweets Feed (/tweets, /tweets/user/:id, composer)
├── /playlists            -> 5. Playlists Grid & Detail Modal (/playlist, /playlist/user/:userId)
├── /subscriptions        -> 6. Subscriptions Management (/subscriptions/u/:subscriberId)
├── /liked-videos         -> 7. Liked Videos Horizontal List (/likes/videos)
├── /analytics            -> 8. Channel Analytics Deep-Dive (/dashboard/stats + timeframe filters)
├── /settings             -> 9. Account & Security Settings (/users/update-account, /avatar, /cover-image, /change-password)
├── /c/:username          -> Channel Public Profile View (/users/c/:username + /videos?userId=...)
└── /upload               -> Standalone or Modal Upload Studio (/videos POST with progress bar)
```

---

## 5. Component Hierarchy & Modular Structure

```
frontend/src/
├── api/
│   ├── client.js             # Base Axios instance with auth interceptor
│   ├── authApi.js            # login, register, logout, currentUser, updateProfile, changePassword
│   ├── videoApi.js           # getAllVideos, getVideoById, publishVideo, updateVideo, deleteVideo, togglePublish
│   ├── tweetApi.js           # createTweet, getUserTweets, updateTweet, deleteTweet
│   ├── commentApi.js         # getVideoComments, addComment, updateComment, deleteComment
│   ├── likeApi.js            # toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos
│   ├── playlistApi.js        # createPlaylist, getUserPlaylists, getPlaylistById, addVideo, removeVideo
│   ├── subscriptionApi.js    # toggleSubscription, getSubscribers, getSubscribedChannels
│   └── dashboardApi.js       # getChannelStats, getChannelVideos
├── components/
│   ├── layout/
│   │   ├── Sidebar.js        # Fixed left navigation matching 9-screen reference
│   │   ├── TopNavbar.js      # Search bar, Upload CTA, New Tweet CTA, User Profile Pill
│   │   └── RootLayout.js     # Responsive scaffold (Sidebar + Navbar + Outlet)
│   ├── common/
│   │   ├── Button.js         # Styled primary, secondary, ghost, danger buttons
│   │   ├── Input.js          # Dark themed inputs, textareas
│   │   ├── Modal.js          # Reusable dark dialog with backdrop
│   │   ├── StatCard.js       # Analytics card with delta pill (+%), icon, metric
│   │   ├── Skeleton.js       # Pulse loading placeholders for cards, tables, player
│   │   ├── EmptyState.js     # Clean illustrative empty state with CTA
│   │   └── ErrorState.js     # Descriptive error card with "Retry" button
│   ├── video/
│   │   ├── VideoCard.js      # Grid card with duration badge, avatar, view counter
│   │   ├── VideoTableItem.js # Management row with status pill (Published/Unpublished), views, actions
│   │   ├── VideoPlayer.js    # Clean dark video player with custom controls
│   │   └── UploadModal.js    # Multi-step upload with drag-and-drop & live progress bar
│   ├── community/
│   │   ├── TweetComposer.js  # Quick post composer with attachment triggers
│   │   └── TweetCard.js      # Social card with like, comment, share, and delete actions
│   └── playlist/
│       ├── PlaylistCard.js   # Card with stacked overlay effect, count badge, total views
│       └── CreatePlaylistModal.js # Name & description creator
├── context/
│   ├── AuthContext.jsx       # User auth state, tokens, current user loader
│   └── ToastContext.jsx      # Notifications for action success/error feedback
├── hooks/
│   ├── useAuth.js            # Easy hook for AuthContext
│   └── useFetch.js           # Generic hook with data, loading, error, and refetch
├── pages/
│   ├── StudioPage.jsx        # Screen 1: Channel Dashboard & Studio
│   ├── WatchPage.jsx         # Screen 2: Video Watch Page & Comments Rail
│   ├── MyVideosPage.jsx      # Screen 3: My Videos Management Table & Status Filter
│   ├── CommunityPage.jsx     # Screen 4: Community / Tweets Feed
│   ├── PlaylistsPage.jsx     # Screen 5: Playlists Grid & Creator
│   ├── SubscriptionsPage.jsx # Screen 6: Subscriptions & Channels
│   ├── LikedVideosPage.jsx   # Screen 7: Liked Videos horizontal list
│   ├── AnalyticsPage.jsx     # Screen 8: Channel Analytics charts & breakdown
│   ├── SettingsPage.jsx      # Screen 9: Profile, Avatar, Cover, Security Settings
│   ├── ChannelPage.jsx       # Channel profile public view (/c/:username)
│   ├── LoginPage.jsx         # Login screen
│   └── RegisterPage.jsx      # Multi-field registration with avatar/cover uploads
├── utils/
│   ├── formatters.js         # formatDuration(sec), formatViews(num), timeAgo(date)
│   └── constants.js          # Route paths, defaults, status filters
└── App.jsx                   # Router provider & context providers
```

---

## 6. Upload Progress & Large File Strategy

### 6.1 Real-Time Upload Progress with Axios
The `uploadVideo` service in `api/videoApi.js` utilizes Axios's native `onUploadProgress`:
```javascript
export const publishVideo = async (formData, onProgress) => {
  return client.post("/videos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      if (onProgress) onProgress(percentCompleted);
    }
  });
};
```

### 6.2 UI Progress States
1. **Selecting**: Drag-and-drop dropzone with preview for thumbnail and video duration/size.
2. **Uploading**: Linear progress bar with percentage readout (`34% uploaded...`), animated shimmer, and transfer stats.
3. **Processing**: Spinner badge showing *"Processing video on server & Cloudinary..."*
4. **Completed**: Success state with link to open video or copy watch URL.

---

## 7. State Handling Standards Across All Views

Every asynchronous view component must satisfy the 3-state UX requirement:
1. **Loading State**: Customized skeleton placeholder matching the layout (grid skeleton, table skeleton, or player skeleton).
2. **Empty State**: Tailored empty prompt with an icon, title, description, and primary CTA (e.g., *"No videos uploaded yet — Share your first video with the world"*).
3. **Error State**: Non-blocking alert or full-width error banner with specific error message extracted from `error.response?.data?.message` and a functional **"Try Again"** button.
