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
2. Run `database/schema.sql` in the Supabase SQL editor. This replaces the old exam-only schema with users, courses, tests, payments, and the rest of the platform tables.
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

## API groups

| Area | App | Admin |
| --- | --- | --- |
| Auth | `/api/auth` | `/api/admin/auth` |
| Users | `/api/users/me` | `/api/admin/users` |
| Courses | `/api/courses` | `/api/admin/courses` |
| Catalog | `/api/groups`, `/api/classes`, `/api/subjects` | `/api/admin/groups`, `/classes`, `/subjects` |
| Content | `/api/content` | `/api/admin/content` |
| Videos | `/api/videos` | `/api/admin/videos` |
| Current affairs | `/api/current-affairs` | `/api/admin/current-affairs` |
| Tests | `/api/tests`, `/api/attempts` | `/api/admin/tests` |
| Payments | `/api/plans`, `/api/payments` | `/api/admin/plans` |
| Support | `/api/support`, `/api/help/faqs` | `/api/admin/support` |
| Legal | `/api/legal` | `/api/admin/legal` |
| Notifications | `/api/notifications` | `/api/admin/notifications` |

Full docs: `http://localhost:4000/api-docs`

Correct answers are omitted from app test payloads until the attempt is submitted.
