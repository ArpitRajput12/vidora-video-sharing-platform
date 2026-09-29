# Vidora — Backend API Specification & Audit Map

This document serves as the **exhaustive single source of truth** mapping all existing backend endpoints, authentication rules, payloads, and response structures in `videoshare/backend/` to their corresponding frontend UI components and screens.

---

## 1. Global Architectural Conventions

### 1.1 Base URL & Routing Prefixes
- **Server Port**: `8000` (default)
- **Base API Path**: `http://127.0.0.1:8000/api/v1`
- **CORS Configured Origin**: `http://127.0.0.1:5173` with `credentials: true`
- **Notice on Route Mounts**:
  - Most resources use plural prefixes (`/users`, `/videos`, `/tweets`, `/subscriptions`, `/likes`, `/comments`, `/dashboard`)
  - **Exception**: Playlists route is mounted as singular `/api/v1/playlist` in `app.js` (`app.use("/api/v1/playlist", playlistRouter)`).

### 1.2 Standard Response Envelope (`ApiResponse`)
All successful HTTP responses adhere strictly to the following envelope:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation description",
  "success": true
}
```

### 1.3 Standard Error Envelope (`ApiError`)
All rejected requests or errors thrown via `ApiError` yield:
```json
{
  "statusCode": 400,
  "message": "Error message description",
  "errors": [],
  "success": false,
  "data": null
}
```

### 1.4 Standard Pagination Structure (`mongoose-aggregate-paginate-v2`)
Paginated endpoints (`/api/v1/videos`, `/api/v1/comments/:videoId`) nest pagination metadata within `data`:
```json
{
  "statusCode": 200,
  "data": {
    "docs": [ ... ],
    "totalDocs": 24,
    "limit": 10,
    "page": 1,
    "totalPages": 3,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  },
  "message": "Success message",
  "success": true
}
```

### 1.5 Authentication Strategy
- **Mechanism**: JSON Web Tokens (Access Token [expiry: `1d`] + Refresh Token [expiry: `10d`]).
- **Dual Support**: 
  - `verifyJWT` checks both `req.cookies?.accessToken` AND `req.header("Authorization")?.replace("Bearer ", "")`.
- **Cookie Security**:
  - `httpOnly: true`, `secure: false` (in dev), `sameSite: "lax"`.
- **Token Refresh Cycle**:
  - `POST /api/v1/users/refresh-token` accepts token from cookie or `req.body.refreshToken`. It rotates both tokens and updates the database record and cookies.

---

## 2. Exhaustive API Endpoint Map

### 2.1 Healthcheck API (`/api/v1/healthcheck`)

| Method | Endpoint | Access | Request Parameters / Body | Response Data Structure | Associated UI Component |
|---|---|---|---|---|---|
| `GET` | `/` | Public | None | `{ uptime: <number> }` | App status indicator / Devtools |

---

### 2.2 Users & Authentication API (`/api/v1/users`)

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `POST` | `/register` | Public | **Headers**: `multipart/form-data`<br>**Body**:<br>- `fullName` (string, required)<br>- `email` (string, required)<br>- `username` (string, required)<br>- `password` (string, required)<br>- `avatar` (file, required, max: 1)<br>- `coverImage` (file, optional, max: 1) | User object without password & refreshToken:<br>`{ _id, username, email, fullName, avatar, coverImage, watchHistory, createdAt, updatedAt }` | Register Page (`/register`) |
| `POST` | `/login` | Public | **Headers**: `application/json`<br>**Body**:<br>- `email` or `username` (string)<br>- `password` (string, required) | `{ user: { _id, username, email, fullName, avatar, coverImage, watchHistory }, accessToken: "<jwt>", refreshToken: "<jwt>" }`<br>*(Also sets `accessToken` & `refreshToken` cookies)* | Login Page (`/login`) |
| `POST` | `/logout` | **Protected** | **Headers**: Bearer token or cookies | `{}` *(clears `accessToken` and `refreshToken` cookies)* | TopNavbar / Settings Logout button |
| `POST` | `/refresh-token` | Public / Cookie | **Body** (optional if cookie sent): `{ refreshToken?: "<jwt>" }` | `{ accessToken: "<jwt>", refreshToken: "<jwt>" }`<br>*(Resets both cookies)* | Axios Auth Interceptor |
| `GET` | `/current-user` | **Protected** | None | User profile object: `{ _id, username, email, fullName, avatar, coverImage, watchHistory, createdAt, updatedAt }` | App root / AuthContext initialization |
| `POST` | `/change-password` | **Protected** | **Body** (JSON):<br>- `oldPassword` (string, required)<br>- `newPassword` (string, required) | `{}` | Settings Page (`/settings` - Security tab) |
| `PATCH` | `/update-account` | **Protected** | **Body** (JSON):<br>- `fullName` (string, required)<br>- `email` (string, required) | Updated user object (without password/refreshToken) | Settings Page (`/settings` - Account tab) |
| `PATCH` | `/avatar` | **Protected** | **Headers**: `multipart/form-data`<br>**Body**:<br>- `avatar` (file, required) | Updated user object with new `avatar` URL | Settings Page / Studio Profile Header |
| `PATCH` | `/cover-image` | **Protected** | **Headers**: `multipart/form-data`<br>**Body**:<br>- `coverImage` (file, required) | Updated user object with new `coverImage` URL | Settings Page / Studio Profile Header |
| `GET` | `/c/:username` | **Protected** | **Params**: `:username` (string) | Channel profile:<br>`{ _id, fullName, username, avatar, coverImage, email, subscribersCount, channelsSubscribedToCount, isSubscribed }` | Channel Header / Studio (`/studio`) |
| `GET` | `/history` | **Protected** | None | Array of videos from `watchHistory` with populated owner:<br>`[ { _id, videoFile, thumbnail, title, description, duration, views, isPublished, createdAt, owner: { _id, fullName, username, avatar } } ]` | Watch History / Liked Videos layout |

---

### 2.3 Videos API (`/api/v1/videos`)
> **Note**: In `video.routes.js`, `router.use(verifyJWT)` is mounted at the top level. Therefore, **all video endpoints require authentication**.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `GET` | `/` | **Protected** | **Query Params**:<br>- `page` (number, default: 1)<br>- `limit` (number, default: 10)<br>- `query` (string, search term for title & description)<br>- `sortBy` (string, field name e.g. `createdAt`, `views`, `duration`)<br>- `sortType` (`"asc"` or `"desc"`)<br>- `userId` (string, filter by channel owner) | Paginated envelope (`docs: Video[]`, `totalDocs`, `totalPages`, etc.). Each video includes populated `owner: { username, fullName, avatar }`. Only returns `isPublished: true`. | Video Feed / Search / Studio Video Grid / Channel Videos |
| `POST` | `/` | **Protected** | **Headers**: `multipart/form-data`<br>**Body**:<br>- `title` (string, required)<br>- `description` (string, required)<br>- `videoFile` (file, required, max: 1)<br>- `thumbnail` (file, required, max: 1) | Newly created video document:<br>`{ _id, videoFile, thumbnail, title, description, duration, views: 0, isPublished: true, owner, createdAt, updatedAt }` | Upload Video Modal / Page (`/upload`) |
| `GET` | `/:videoId` | **Protected** | **Params**: `:videoId` (Mongo ID)<br>*(Automatically increments `views` count by 1)* | Video document with populated `owner: { username, fullName, avatar }` | Video Watch Page (`/watch/:videoId`) |
| `PATCH` | `/:videoId` | **Protected** | **Params**: `:videoId`<br>**Headers**: `multipart/form-data` or JSON<br>**Body**:<br>- `title` (string, optional)<br>- `description` (string, optional)<br>- `thumbnail` (file, optional, single) | Updated video document | Video Edit Modal / Studio Management |
| `DELETE` | `/:videoId` | **Protected** | **Params**: `:videoId` (Mongo ID) | `{}` | Video Management (`/my-videos`, `/studio`) |
| `PATCH` | `/toggle/publish/:videoId` | **Protected** | **Params**: `:videoId` (Mongo ID) | Updated video document with toggled `isPublished` boolean | Video Management Table / Toggle Switch |

---

### 2.4 Tweets / Community API (`/api/v1/tweets`)
> **Note**: `router.use(verifyJWT)` protects all tweet endpoints.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `POST` | `/` | **Protected** | **Body** (JSON):<br>- `content` (string, required) | `{ tweet: { _id, content, owner: "<userId>", createdAt, updatedAt } }` | Community Composer (`/community`, `/studio`) |
| `GET` | `/user/:userId` | **Protected** | **Params**: `:userId` (Mongo ID) | Array of tweets with populated `owner: { username, avatar }` | Community Feed / Channel Community Tab |
| `PATCH` | `/:tweetId` | **Protected** | **Params**: `:tweetId`<br>**Body** (JSON):<br>- `newcontent` (string, required) | Updated tweet document | Tweet Card Edit Option |
| `DELETE` | `/:tweetId` | **Protected** | **Params**: `:tweetId` (Mongo ID) | `{}` | Tweet Card Delete Option |

---

### 2.5 Subscriptions API (`/api/v1/subscriptions`)
> **Note**: `router.use(verifyJWT)` protects all subscription endpoints.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `POST` | `/c/:channelId` | **Protected** | **Params**: `:channelId` (Mongo ID)<br>*(Disallows self-subscription)* | `{ subscribed: true }` or `{ subscribed: false }` | Subscribe / Subscribed Toggle Button (`/watch/:videoId`, `/c/:username`, `/subscriptions`) |
| `GET` | `/c/:channelId` | **Protected** | **Params**: `:channelId` (Mongo ID) | Array of subscriber objects:<br>`[ { _id, username, avatar, coverImage, isSubscribed } ]` | Channel Subscribers List / Studio Analytics |
| `GET` | `/u/:subscriberId` | **Protected** | **Params**: `:subscriberId` (Mongo ID) | Array of channel objects the user follows | Subscriptions Page (`/subscriptions`) |

---

### 2.6 Likes API (`/api/v1/likes`)
> **Note**: `router.use(verifyJWT)` protects all like endpoints.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `POST` | `/toggle/v/:videoId` | **Protected** | **Params**: `:videoId` (Mongo ID) | `{ liked: true }` or `{ liked: false }` | Watch Page Video Like Button |
| `POST` | `/toggle/c/:commentId` | **Protected** | **Params**: `:commentId` (Mongo ID) | `{ liked: true }` or `{ liked: false }` | Comment Item Like Button |
| `POST` | `/toggle/t/:tweetId` | **Protected** | **Params**: `:tweetId` (Mongo ID) | `{ liked: true }` or `{ liked: false }` | Community Tweet Like Button |
| `GET` | `/videos` | **Protected** | None | Array of liked video objects | Liked Videos Page (`/liked-videos`) |

---

### 2.7 Comments API (`/api/v1/comments`)
> **Note**: `router.use(verifyJWT)` protects all comment endpoints.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `GET` | `/:videoId` | **Protected** | **Params**: `:videoId`<br>**Query Params**:<br>- `page` (default: 1)<br>- `limit` (default: 10) | Paginated envelope (`docs: Comment[]`). Each comment has:<br>`{ _id, content, createdAt, likesCount, isLiked, ownerDetails: { username, avatar } }` | Watch Page Comments Section (`/watch/:videoId`) |
| `POST` | `/:videoId` | **Protected** | **Params**: `:videoId`<br>**Body** (JSON):<br>- `content` (string, required) | Populated comment:<br>`{ _id, content, video, owner: { _id, username, email, avatar }, createdAt, updatedAt }` | Watch Page Comment Composer |
| `PATCH` | `/c/:commentId` | **Protected** | **Params**: `:commentId`<br>**Body** (JSON):<br>- `newComment` (string, required) | Updated comment object: `{ _id, content, video, owner, createdAt, updatedAt }` | Comment Item Edit Trigger |
| `DELETE` | `/c/:commentId` | **Protected** | **Params**: `:commentId` | `{}` | Comment Item Delete Trigger |

---

### 2.8 Playlists API (`/api/v1/playlist`)
> **Crucial Note**: The backend route mount in `app.js` is singular: `/api/v1/playlist`.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `POST` | `/` | **Protected** | **Body** (JSON):<br>- `name` (string, required)<br>- `description` (string, required) | Created playlist: `{ _id, name, description, videos: [], owner, createdAt, updatedAt }` | Create Playlist Modal (`/playlists`) |
| `GET` | `/user/:userId` | **Protected** | **Params**: `:userId` | Array of playlist summaries:<br>`[ { _id, name, description, totalVideos, totalViews, updatedAt } ]` | Playlists Grid (`/playlists`, `/c/:username`) |
| `GET` | `/:playlistId` | **Protected** | **Params**: `:playlistId` | Detailed playlist object:<br>`{ _id, name, description, totalVideos, totalViews, createdAt, updatedAt, videos: [ { _id, thumbnail, title, description, duration, views, createdAt } ], owner: { username, fullName, avatar } }` | Playlist Detail View / Modal |
| `PATCH` | `/:playlistId` | **Protected** | **Params**: `:playlistId`<br>**Body** (JSON):<br>- `name` (string, required)<br>- `description` (string, required) | Updated playlist document | Edit Playlist Modal |
| `DELETE` | `/:playlistId` | **Protected** | **Params**: `:playlistId` | `{}` | Delete Playlist Action |
| `PATCH` | `/add/:videoId/:playlistId` | **Protected** | **Params**: `:videoId`, `:playlistId` | Updated playlist document | Save to Playlist Modal on Watch Page |
| `PATCH` | `/remove/:videoId/:playlistId` | **Protected** | **Params**: `:videoId`, `:playlistId` | Updated playlist document | Playlist Management / Remove Video Action |

---

### 2.9 Dashboard API (`/api/v1/dashboard`)
> **Note**: `router.use(verifyJWT)` protects all dashboard endpoints. All queries are scoped to `req.user._id`.

| Method | Endpoint | Access | Request Details | Response Data Structure (`data`) | Associated UI Component |
|---|---|---|---|---|---|
| `GET` | `/stats` | **Protected** | None | `{ totalVideos: <number>, totalViews: <number>, totalSubscribers: <number>, totalLikes: <number> }` | Studio & Analytics Stat Cards (`/studio`, `/analytics`) |
| `GET` | `/videos` | **Protected** | None | Array of all videos owned by channel creator (published & unpublished):<br>`[ { _id, videoFile, thumbnail, title, description, duration, views, isPublished, createdAt, likesCount, commentsCount } ]` | Studio "Your Videos" & My Videos (`/my-videos`, `/studio`) |

---

## 3. Discrepancies, Fatal Bugs & Edge Cases Identified

During the Phase 1 backend audit, several critical edge cases and potential bugs were uncovered in the existing backend codebase. As per instructions, **no backend files have been modified**, but these must be formally highlighted for review:

1. **Cloudinary Upload Resource Type (`cloudinary.js` vs `video.controller.js`)**:
   - In `backend/src/utils/cloudinary.js` (line 21), uploads are hardcoded to `resource_type: "image"`.
   - In `backend/src/controllers/video.controller.js` (line 117), `uploadOnCloudinary(videoFileLocalPath)` is called with a video file (e.g., MP4). Cloudinary API will fail when uploading videos under `resource_type: "image"`.
   - *Recommendation*: Allow `uploadOnCloudinary(localFilePath, resourceType = "auto")`.

2. **Tweet Update Logic Inversion (`tweet.controller.js`)**:
   - In `backend/src/controllers/tweet.controller.js` (line 97):
     ```javascript
     if(!newcontent || newcontent.trim() !== ""){
         throw new ApiError(400, "Content is required")
     }
     ```
   - Because `newcontent.trim() !== ""` evaluates to `true` whenever non-empty text is supplied, updating any tweet triggers a `400 "Content is required"` error!
   - *Recommendation*: Invert check to `if(!newcontent || newcontent.trim() === "")`.

3. **Get Subscribed Channels Projection (`subscription.controller.js`)**:
   - In `backend/src/controllers/subscription.controller.js` (lines 173–175):
     ```javascript
     username: "channelDetails.username",
     avatar: "channelDetails.avatar",
     coverImage: "channelDetails.coverImage"
     ```
   - Notice the lack of the `$` operator. MongoDB interprets `"channelDetails.username"` as a static string literal instead of extracting the field value `$channelDetails.username`.

4. **Liked Videos Aggregation Typo & Missing `$` (`like.controller.js`)**:
   - In `backend/src/controllers/like.controller.js` (lines 194–214):
     - Line 195: `$first: "ownerDetails"` is missing `$` (should be `"$ownerDetails"`).
     - Line 198: `$first: "videoDetials"` has a typo and is missing `$` (should be `"$videoDetails"`).
     - Line 204: `$videosDetails.thumbnail` references `$videosDetails` instead of `$videoDetails`.
     - Line 213: `"ownerDetails.avatar"` is missing `$` prefix.
     - The video `_id` is omitted in the projection.

5. **Payload Key Inconsistencies for Frontend to Note**:
   - Comment update: requires `{ newComment: "text" }` (not `{ content: "text" }`).
   - Tweet update: requires `{ newcontent: "text" }` (lowercase without underscore/camelCase).
   - Playlist mount path: `/api/v1/playlist` (singular, NOT `/playlists`).

6. **All Video Routes Protected**:
   - Notice that `video.routes.js` applies `router.use(verifyJWT)` globally. In Vidora, users must be logged in to view `/api/v1/videos` or `/api/v1/videos/:videoId`. The frontend will accommodate this with seamless auth state checking.
