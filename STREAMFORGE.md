# StreamForge — Project Brain (claude.md)

> This document is read by ALL agents at the start of every session.
> Do not modify conventions or decisions without updating this file.
> Last updated: 2026-03-19

---

## 1. Project Identity

**App Name:** StreamForge

**What it is:** A modern video platform where users upload, watch, and interact
with video content. Focus: smooth streaming, clean UI, developer-friendly architecture.

**Scale target:** MVP for 1,000 concurrent users. Architecture must not block
migration to microservices or horizontal scaling later.

**Core principle:** Never block the user. All heavy operations (video processing,
notifications) are async and queued.

---

## 2. Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, React, TypeScript     |
| Styling     | Tailwind CSS (NOT MUI — decided)  |
| Backend     | Node.js + Express, REST API       |
| Database    | MongoDB (Mongoose ODM)            |
| Auth        | JWT (access token + refresh token)|
| Storage     | AWS S3                            |
| CDN         | AWS CloudFront (TBD — configure at deploy) |
| Video Processing | Cloudinary Video (transcoding, HLS, thumbnails) |

---

## 3. Architecture

### High-Level Map

```
Browser (Next.js)
    │
    ├──► /api/v1/* (Express REST API)
    │         │
    │         ├──► MongoDB (metadata: users, videos, comments, subs)
    │         ├──► S3 (video files, thumbnails)
    │         └──► BullMQ/Redis (async job queue)
    │
    └──► CloudFront CDN (video streaming — bypasses API)
```

### Video Upload Flow (step-by-step)

```
1. Frontend requests pre-signed S3 URL from Backend
2. Frontend uploads video file directly to S3 (not through backend)
3. S3 triggers webhook → Backend receives upload-complete event
4. Backend creates video record in MongoDB (status: "processing")
5. Backend queues transcoding job (BullMQ)
6. Worker transcodes video → stores HLS segments back to S3
7. Backend updates MongoDB (status: "ready")
8. Frontend polls /api/v1/videos/:id/status → shows player when ready
```

### Key Services (Monolith — all in one Express app)

- **Auth Service** — register, login, JWT issue/refresh/revoke
- **Video Service** — upload, transcode queue, metadata, streaming
- **Comment Service** — CRUD, threaded replies (future)
- **Subscription Service** — follow/unfollow, feed generation

---

## 4. Agent Boundaries

> Agents must NOT cross these boundaries without explicit instruction.

### Frontend Agent
- **Owns:** All Next.js pages, React components, client-side state (Redux), API calls from client
- **Does NOT:** Write Express routes, touch MongoDB schemas, write server logic
- **Consumes:** API contracts defined by Backend Agent
- **Styling rule:** Tailwind CSS only — no inline styles, no MUI

### Backend Agent
- **Owns:** Express routes, business logic, MongoDB schemas (Mongoose), JWT logic, S3 pre-signed URLs
- **Does NOT:** Write React components or Next.js pages
- **Defines:** API contracts — Frontend must follow what Backend publishes here
- **Error format:** Always `{ success: false, error: { code: string, message: string } }`

### DevOps Agent
- **Owns:** Docker, CI/CD config, environment variable management, S3 bucket config, CloudFront setup
- **Does NOT:** Write application code (no Express routes, no React)
- **Works from:** Architecture section of this file

### Debug Agent
- **Reactive only** — called when something is broken, not for building
- **Has read access to everything, owns nothing**
- **Entry point:** Always start with logs, then trace the request/data flow

### UI/UX Agent
- **Owns:** Design decisions, component visual behavior, responsiveness, accessibility
- **Works with:** Frontend Agent — provides specs, Frontend implements
- **Does NOT:** Write backend code

---

## 5. API Contracts

> Backend Agent writes here. Frontend Agent reads here.
> Format: METHOD /api/v1/route — description

### Auth
```
POST   /api/v1/auth/register     → create user account
POST   /api/v1/auth/login        → returns { accessToken, refreshToken }
POST   /api/v1/auth/refresh      → returns new accessToken
POST   /api/v1/auth/logout       → revokes refresh token
```

### Videos
```
GET    /api/v1/videos            → list videos (paginated)
GET    /api/v1/videos/:id        → get single video metadata
GET    /api/v1/videos/:id/status → check processing status
POST   /api/v1/videos/upload-url → get pre-signed S3 URL
POST   /api/v1/videos            → create video record after upload
DELETE /api/v1/videos/:id        → delete video (owner only)
```

### Comments
```
GET    /api/v1/videos/:id/comments     → list comments for video
POST   /api/v1/videos/:id/comments     → add comment
DELETE /api/v1/comments/:commentId     → delete comment (owner only)
```

### Subscriptions
```
POST   /api/v1/subscriptions/:creatorId   → subscribe to creator
DELETE /api/v1/subscriptions/:creatorId   → unsubscribe
GET    /api/v1/subscriptions/feed         → get subscribed creators' videos
```

---

## 6. Conventions

### API Routes
- Always prefix: `/api/v1/`
- Plural resource names: `/videos`, `/comments`, `/users`
- No verbs in routes: use HTTP methods instead (`GET /videos` not `GET /getVideos`)

### Frontend Components
- PascalCase with purpose suffix: `VideoPlayer.tsx`, `CommentList.tsx`
- One component per file
- Co-locate styles as Tailwind classes — no separate CSS files for components

### Frontend Folder Structure
```
/app                    ← Next.js App Router pages
/components
  /ui                   ← Generic reusable (Button, Modal, Spinner)
  /features
    /video              ← VideoPlayer, VideoCard, UploadModal
    /comments           ← CommentList, CommentInput
    /auth               ← LoginForm, SignupForm
    /subscriptions      ← SubscribeButton, CreatorCard
/lib
  /api                  ← axios wrappers for each service
  /hooks                ← Custom React hooks
  /store                ← Redux slices (one per domain)
```

### Backend Folder Structure
```
/src
  /routes               ← Express routers (auth.routes.js, video.routes.js)
  /controllers          ← Request handlers
  /services             ← Business logic (no Express objects here)
  /models               ← Mongoose schemas
  /middleware           ← auth, error handler, rate limiter
  /jobs                 ← BullMQ job processors
  /utils                ← Shared utilities
```

### Git Conventions
```
Branch naming:
  feature/video-upload
  fix/comment-bug
  chore/update-dependencies

Commit format:
  feat: add video upload API
  fix: resolve auth token expiry issue
  chore: update S3 bucket config
  docs: update API contracts in claude.md
```

### Error Response Format (Backend — always)
```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "The requested video does not exist"
  }
}
```

### Success Response Format (Backend — always)
```json
{
  "success": true,
  "data": { }
}
```

---

## 7. Decisions Log

| Date | Decision | Why | Rejected Alternative |
|------|----------|-----|----------------------|
| 2026-03-19 | Next.js 14 (not plain React) | Built-in routing, SSR/ISR, SEO | Plain React (no SSR) |
| 2026-03-19 | MongoDB (not PostgreSQL) | Flexible schema, fast iteration, nested data (comments/replies) | PostgreSQL (rigid schema at MVP speed) |
| 2026-03-19 | S3 for video storage | Scalable, CDN-ready, reduces backend load | Storing on server (not scalable) |
| 2026-03-19 | Monolith first (not microservices) | Faster MVP, easier debugging, migrate later | Microservices (too complex for MVP) |
| 2026-03-19 | JWT auth (not sessions) | Stateless, scales horizontally, works for future mobile | Cookie sessions (stateful, harder with mobile) |
| 2026-03-19 | Tailwind CSS (not MUI) | Custom design language, not Material Design look | MUI (generic look, fights custom design) |
| 2026-03-19 | Direct S3 upload (pre-signed URL) | Backend not a bottleneck for large files | Upload via backend (memory/bandwidth risk) |
| 2026-03-19 | Cloudinary Video for transcoding | Zero infrastructure, handles HLS + CDN + thumbnails, zero cost until real traffic | FFmpeg self-hosted (complex ops, requires BullMQ workers at MVP stage) |

---

## 8. Current State

```
Status: Project Design Phase

Done:
  - Project name and identity defined (StreamForge)
  - Tech stack decided
  - Architecture designed
  - Agent boundaries defined
  - API contracts drafted
  - Conventions established

In Progress:
  - claude.md (this file) — being refined

Not Started:
  - Project scaffolding (Next.js + Express)
  - Auth service
  - Video upload flow
  - Video player
  - Comments
  - Subscriptions
```

---

## 9. Open Questions

> These are NOT decided. Do not implement assumptions about these.

- [ ] Real-time comments: WebSockets (Socket.io) or polling?
- [ ] Like/Dislike system (future scope — not MVP)
- [ ] Notifications system (future scope)
- [ ] Search & recommendation engine (future scope)
- [ ] CloudFront CDN: configure at deploy time
- [ ] Redis/BullMQ: introduce when video processing is built

---

*This file is the single source of truth for StreamForge.*
*All agents read this first. All major decisions are recorded here.*
