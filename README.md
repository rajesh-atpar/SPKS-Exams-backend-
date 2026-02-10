# Backend API

Production-ready Node.js backend with **Supabase Auth** and **Swagger**. Ready to connect with React, Next.js, or React Native.

## Tech stack

- **Node.js** (v18+)
- **Express.js**
- **Supabase** (Auth + DB via `@supabase/supabase-js`)
- **dotenv**
- **Swagger** (swagger-jsdoc + swagger-ui-express)
- **CORS** enabled

## Install

```bash
npm install
```

## Environment

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Edit `.env` and set:

- `SUPABASE_URL` – from [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**
- `SUPABASE_ANON_KEY` – same place (Project API keys → anon public)

## How to run

**Production:**

```bash
npm start
```

**Development (auto-reload):**

```bash
npm run dev
```

Server runs at **http://localhost:4000** (or the `PORT` in `.env`).

## API docs (Swagger)

- **Swagger UI:** http://localhost:4000/api-docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register (email + password) |
| POST | `/api/auth/login` | Login (email + password) |

### POST `/api/auth/register`

- **Body:** `{ "email": "user@example.com", "password": "password123", "fullName": "Optional Name" }`
- **Success (201):** `{ success: true, message: "...", data: { user, session } }`
- **Errors:** 400 (validation), 409 (user already exists)

### POST `/api/auth/login`

- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Success (200):** `{ success: true, message: "Login successful", data: { user, session } }`
- **Errors:** 400 (validation), 401 (invalid credentials)

## Response format

All responses use this shape:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "code": "ERROR_CODE"
}
```

## Project structure

```
src/
  server.js              # Entry point
  app.js                  # Express app, middleware, routes
  config/
    swagger.js            # Swagger setup & schemas
  controllers/
    auth.controller.js    # Register & login logic
  middleware/
    errorHandler.js       # Central error & 404 handler
  routes/
    auth.routes.js        # POST /register, /login
  services/
    supabaseClient.js     # Supabase client (SUPABASE_URL, SUPABASE_ANON_KEY)
```

## Supabase setup

- In Supabase: **Authentication** → **Providers** → **Email** → enable **Email**.
- If “Confirm email” is on, users must confirm before they can log in.

## Frontend usage

Use the same `fetch` calls from React, Next.js, or React Native. Example:

```javascript
const API = 'http://localhost:4000';

// Register
const res = await fetch(`${API}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, fullName }),
});
const data = await res.json();
if (data.success) {
  const { user, session } = data.data;
  // Store session.accessToken for authenticated requests
}

// Login
const loginRes = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const loginData = await loginRes.json();
if (loginData.success) {
  const { user, session } = loginData.data;
}
```

For protected routes, send the token in the header: `Authorization: Bearer <accessToken>`.
