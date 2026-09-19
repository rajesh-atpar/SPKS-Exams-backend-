# SPKS Backend API

Express + Supabase backend for the SPKS mobile app and admin panel.

## Stack

- Node.js 18+ and Express
- PostgreSQL via Supabase
- JWT access tokens + stored refresh tokens
- bcrypt password hashing
- Razorpay payments
- Swagger at `/`

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase, JWT, and optional Razorpay keys.
 2. Run `database/schema.sql` in the Supabase SQL editor for a new database. For an existing database, run `database/migrations/2026-09-17-missing-features.sql`, `database/migrations/2026-09-18-lesson-pdfs.sql`, and `database/migrations/2026-09-19-uploads-bucket.sql` instead. The last file creates the public `uploads` Storage bucket required for lesson PDFs.
3. Install and start:

```bash
npm install
npm run seed:admin
npm run dev
```

Default seed admin is `admin@spks.com` / `Admin123`. Change this immediately.

## Auth

App users register and log in at `/api/auth/*` with role `user`.

Staff log in at `/api/admin/auth/*`. Roles are `admin`, `editor`, and `support`.

Send `Authorization: Bearer <accessToken>` on protected routes. Use `refreshToken` with `/refresh-token` to rotate tokens.

Premium items return `isPremium` and `isLocked`. Locked items hide `fileUrl` / `pdfUrl` / `pdfViewUrl` / `viewUrl` / `videoUrl` / `youtubeId`. Download, video play, and test start return `403` with `code: PREMIUM_REQUIRED` until `GET /api/subscriptions/current` is an active paid plan. Lesson and content PDFs should be opened with `pdfViewUrl` / `viewUrl` in an in-app PDF viewer (`Content-Disposition: inline`). Do not save those files to device storage.

Correct answers are omitted from app test payloads until the attempt is submitted. After submit, the result is stored with `userId` and returned to the same user (`/api/attempts/:attemptId/result` and `/api/users/me/test-history`).

Admin creates a published test under a course group (TNPSC Group 1–4 or Others), then adds questions with `options` and `correctAnswer`. The app Test screen lists those groups, starts the paper, shows choices, and writes the scored result to that user.

## App APIs

| Area | Method | Path |
| --- | --- | --- |
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | POST | `/api/auth/logout` |
| Auth | POST | `/api/auth/refresh-token` |
| Auth | POST | `/api/auth/forgot-password` |
| Auth | POST | `/api/auth/reset-password` |
| Auth | POST | `/api/auth/change-password` |
| Auth | GET | `/api/auth/me` |
| Profile | GET/PATCH | `/api/users/me` |
| Profile | POST/DELETE | `/api/users/me/profile-image` |
| Settings | GET/PATCH | `/api/users/me/settings` |
| Account | DELETE | `/api/users/me/account` |
| Bookmarks | GET | `/api/users/me/bookmarks` |
| Progress | GET | `/api/users/me/progress` |
| Progress | GET | `/api/users/me/continue-learning` |
| Progress | GET | `/api/users/me/course-progress` |
| Progress | GET | `/api/users/me/activity` |
| Progress | GET | `/api/users/me/streak` |
| Progress | GET | `/api/users/me/analytics` |
| Progress | GET | `/api/users/me/stats` |
| Tests | GET | `/api/users/me/attempts` |
| Tests | GET | `/api/users/me/test-history` |
| Push | POST/DELETE | `/api/users/me/device-token` |
| Catalog | GET | `/api/courses` |
| Catalog | GET | `/api/courses/:courseId` |
| Catalog | GET | `/api/courses/:courseId/groups` |
| Catalog | GET | `/api/courses/:courseId/notes` `/books` `/outside-sources` `/videos` `/tests` |
| Catalog | GET | `/api/groups/:groupId` |
| Catalog | GET | `/api/groups/:groupId/classes` `/subjects` `/books` `/notes` `/outside-sources` `/videos` `/tests` |
| Catalog | GET | `/api/classes/:classId/subjects` |
| Catalog | GET | `/api/subjects/:subjectId/chapters` `/content` |
| Catalog | GET | `/api/chapters/:chapterId/lessons` `/content` |
| Lessons | GET | `/api/lessons/:lessonId` |
| Lessons | GET | `/api/lessons/:lessonId/pdf` (inline view, not download) |
| Lessons | POST | `/api/lessons/:lessonId/progress` |
| Lessons | POST | `/api/lessons/:lessonId/complete` |
| Content | GET | `/api/content` `/api/content/:contentId` |
| Content | GET | `/api/content/:contentId/view` (inline PDF view) |
| Content | GET | `/api/content/:contentId/download` |
| Content | POST/DELETE | `/api/content/:contentId/bookmark` |
| Videos | GET | `/api/videos` `/api/videos/:videoId` |
| Videos | POST | `/api/videos/:videoId/view` |
| Videos | POST/DELETE | `/api/videos/:videoId/bookmark` |
| Current affairs | GET | `/api/current-affairs` `/monthly` `/:articleId` |
| Current affairs | POST/DELETE | `/api/current-affairs/:articleId/bookmark` |
| Tests | GET | `/api/tests` `/api/tests/:testId` |
| Tests | POST | `/api/tests/:testId/start` |
| Tests | GET | `/api/attempts/:attemptId` |
| Tests | POST | `/api/attempts/:attemptId/answers` |
| Tests | POST | `/api/attempts/:attemptId/submit` |
| Tests | GET | `/api/attempts/:attemptId/result` |
| Plans | GET | `/api/plans` `/api/plans/:planId` |
| Subscription | GET | `/api/subscriptions/current` |
| Subscription | POST | `/api/subscriptions/:subscriptionId/cancel` |
| Payments | POST | `/api/payments/create-order` |
| Payments | POST | `/api/payments/verify` |
| Payments | GET | `/api/payments/history` |
| Help | GET | `/api/help/faqs` `/api/help/contact` |
| Support | POST/GET | `/api/support/tickets` |
| Support | GET | `/api/support/tickets/:ticketId` |
| Support | POST | `/api/support/tickets/:ticketId/messages` |
| Legal | GET | `/api/legal/terms` `/privacy-policy` `/refund-policy` |
| Notifications | GET | `/api/notifications` |
| Notifications | PATCH | `/api/notifications/read-all` `/:id/read` |

## Admin APIs

All `/api/admin/*` routes except login/forgot/reset/refresh require a staff Bearer token.

| Area | Method | Path |
| --- | --- | --- |
| Auth | POST | `/api/admin/auth/login` |
| Auth | POST | `/api/admin/auth/forgot-password` |
| Auth | POST | `/api/admin/auth/reset-password` |
| Auth | POST | `/api/admin/auth/change-password` |
| Auth | POST | `/api/admin/auth/refresh-token` |
| Auth | POST | `/api/admin/auth/logout` |
| Auth | GET | `/api/admin/auth/me` |
| Users | GET/POST | `/api/admin/users` |
| Users | GET/PATCH/DELETE | `/api/admin/users/:userId` |
| Users | PATCH | `/api/admin/users/:userId/status` |
| Users | GET | `/api/admin/users/:userId/progress` `/continue-learning` `/activity` `/course-progress` `/test-history` |
| Courses | GET/POST | `/api/admin/courses` |
| Courses | GET/PATCH/DELETE | `/api/admin/courses/:courseId` |
| Groups | GET/POST | `/api/admin/groups` |
| Groups | GET/PATCH/DELETE | `/api/admin/groups/:groupId` |
| Classes | GET/POST | `/api/admin/classes` |
| Classes | GET/PATCH/DELETE | `/api/admin/classes/:classId` |
| Subjects | GET/POST | `/api/admin/subjects` |
| Subjects | GET/PATCH/DELETE | `/api/admin/subjects/:subjectId` |
| Content | GET/POST | `/api/admin/content` |
| Content | POST | `/api/admin/content/upload` |
| Content | GET/PATCH/DELETE | `/api/admin/content/:contentId` |
| Chapters | GET/POST | `/api/admin/chapters` |
| Chapters | GET/PATCH/DELETE | `/api/admin/chapters/:chapterId` |
| Lessons | GET/POST | `/api/admin/lessons` |
| Lessons | POST | `/api/admin/lessons/upload` |
| Lessons | GET/PATCH/DELETE | `/api/admin/lessons/:lessonId` |
| Lessons | POST | `/api/admin/lessons/:lessonId/pdf` (replace PDF) |
| Videos | GET/POST | `/api/admin/videos` (`groupId` supported) |
| Videos | GET/PATCH/DELETE | `/api/admin/videos/:videoId` |
| Current affairs | GET/POST | `/api/admin/current-affairs` |
| Current affairs | POST | `/api/admin/current-affairs/upload` |
| Current affairs | GET/PATCH/DELETE | `/api/admin/current-affairs/:articleId` |
| Tests | GET/POST | `/api/admin/tests` |
| Tests | GET/PATCH/DELETE | `/api/admin/tests/:testId` |
| Questions | POST | `/api/admin/tests/:testId/questions` (`question`, `options[]`, `correctAnswer`) |
| Questions | POST | `/api/admin/questions/upload` |
| Questions | PATCH/DELETE | `/api/admin/questions/:questionId` |
| Results | GET | `/api/admin/results?userId=&testId=` |
| Results | GET | `/api/admin/tests/:testId/results` |
| Results | GET | `/api/admin/attempts/:attemptId/result` |
| Analytics | GET | `/api/admin/analytics/overview` `/users` `/courses` `/tests` `/revenue` |
| Plans | GET/POST | `/api/admin/plans` |
| Plans | PATCH/DELETE | `/api/admin/plans/:planId` |
| Billing | GET | `/api/admin/subscriptions` `/api/admin/payments` |
| FAQs | GET/POST | `/api/admin/faqs` |
| FAQs | GET/PATCH/DELETE | `/api/admin/faqs/:faqId` |
| Help | GET/PATCH | `/api/admin/help/contact` |
| Support | GET | `/api/admin/support/tickets` `/:ticketId` |
| Support | PATCH | `/api/admin/support/tickets/:ticketId/status` |
| Support | POST | `/api/admin/support/tickets/:ticketId/reply` |
| Legal | GET/PATCH | `/api/admin/legal/terms` `/privacy-policy` `/refund-policy` |
| Notifications | GET/POST | `/api/admin/notifications` |
| Notifications | POST | `/api/admin/notifications/send` |

Full interactive docs: `http://localhost:4000/api-docs`

## Production

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Set these on the host:

- `NODE_ENV=production`
- `PORT` (host-provided)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (long random string, not the example value)
- `FRONTEND_ADMIN_URL` and `FRONTEND_STUDENT_URL` (exact origin URLs)
- Optional: Razorpay, SMTP, `SWAGGER_ENABLED=false`

Run `database/schema.sql` in Supabase before go-live, then `NODE_ENV=production npm run seed:admin` once and change the default password.
