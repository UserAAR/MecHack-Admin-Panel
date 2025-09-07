# MecHack Admin Panel

<p align="center">
  <img src="/public/logo/logo.jpg" alt="MecHack Logo" width="140" height="140" />
</p>

<p align="center">
  <a href="https://nextjs.org/" target="_blank"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" /></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" /></a>
  <a href="https://tailwindcss.com/" target="_blank"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-3-38BDF8?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://supabase.com/" target="_blank"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-SSR%20%2F%20Storage-3ECF8E?logo=supabase&logoColor=white" /></a>
  <a href="https://www.radix-ui.com/" target="_blank"><img alt="Radix" src="https://img.shields.io/badge/Radix%20UI-Accessible-111827" /></a>
</p>

> A secure, role-based administration interface for managing MecHack content, media, users, and system settings. Built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase. Includes a polished UX with a smooth top-loading progress bar and consistent design system.


## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Routing & Modules](#routing--modules)
- [Authentication & Roles](#authentication--roles)
- [Media Library](#media-library)
- [Audit Logs](#audit-logs)
- [Styling & UI](#styling--ui)
- [Quality & Scripts](#quality--scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)


## Overview
The Admin Panel is a separate Next.js application designed for editors and administrators. It uses server-first data fetching with Supabase SSR clients, protects routes via middleware, and enforces role-based access (Admin, Superadmin). The UI is clean, responsive, and optimized for daily content workflows.


## Key Features
- Content Management
  - Create, edit, publish: News, Projects, Events
  - Rich text editing (TipTap with image support)
  - Slug generation and basic SEO fields
- Users & Roles
  - Role-based access: Admin, Superadmin
  - Superadmin-only sections (e.g., Users management)
- Media Library
  - Drag & drop uploads to Supabase Storage
  - Folder-like organization (news, projects, events, uploads)
  - Grid/List views, sort and search
- Observability & System
  - Audit trail via `/api/audit` endpoint
  - Top loader progress indicator for navigation
- UX & Productivity
  - Keyboard-friendly forms
  - Consistent components and layout
  - Dark mode support via theme toggle


## Architecture
- Next.js 15 App Router (`/src/app`) with server components
- Supabase SSR integration for secure, cookie-based sessions
- Middleware protection for authenticated and role-guarded routes
- Modular feature directories: `content/`, `media/`, `users/`, `settings/`, etc.

Supabase Clients
- Server: `src/lib/supabase/server.ts`
- Browser: `src/lib/supabase/client.ts`

Middleware
- `src/middleware.ts` verifies session cookies and redirects unauthenticated users to `/auth/sign-in`
- Fetches `profiles.role` and restricts access to admin-only routes
- Redirects non-admins to the public website (configurable)


## Tech Stack
- Framework: Next.js 15, React 19, TypeScript 5
- Data: Supabase (Auth, Postgres, Storage)
- UI: Tailwind CSS 3, Radix Primitives, custom components
- Charts: ApexCharts, Recharts
- Forms: React Hook Form + Zod
- Editor: TipTap (+ image extension)


## Getting Started
1) Requirements
- Node.js 20 LTS (recommended) or >=18.17
- npm 9+ (or yarn/pnpm/bun)

2) Install dependencies
```bash
cd admin-panel
npm install
```

3) Environment variables
Create `admin-panel/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Where to send users when they are not allowed in admin (e.g., public website)
NEXT_PUBLIC_PUBLIC_WEBSITE_URL=https://your-public-site.example
```
> Do not expose service role keys in the frontend.

4) Run the dev server
```bash
npm run dev
# open http://localhost:3000
```

5) Build & start
```bash
npm run build
npm start
```


## Project Structure
```
admin-panel/
├─ public/                  # Static assets (logo, images)
├─ src/
│  ├─ app/
│  │  ├─ (home)/            # Dashboard overview
│  │  ├─ auth/              # Sign-in, change password
│  │  ├─ content/
│  │  │  ├─ news/           # News list + form
│  │  │  ├─ projects/       # Projects list + form
│  │  │  └─ events/         # Events list + form
│  │  ├─ media/             # Media library
│  │  ├─ users/             # Users (superadmin-only)
│  │  ├─ settings/          # Settings sections
│  │  ├─ api/               # Route handlers (audit, auth, deploy, ...)
│  │  ├─ layout.tsx         # Global layout with AppFrame
│  │  └─ AppFrame.tsx       # Header, Sidebar, shell
│  ├─ components/           # UI building blocks
│  ├─ hooks/                # Hooks (use-role, etc.)
│  ├─ lib/                  # Supabase, profile utils, helpers
│  ├─ services/             # Charts/services
│  ├─ css/                  # Global styles
│  └─ types/                # Type definitions
├─ middleware.ts            # Auth + RBAC guard
├─ next.config.mjs
├─ package.json
└─ README.md
```


## Routing & Modules
- Auth: `/auth/sign-in`
- Dashboard: `/`
- Content:
  - News: `/content/news`, `/content/news/new`, `/content/news/[id]/edit`
  - Projects: `/content/projects`, `/content/projects/new`, `/content/projects/[id]/edit`
  - Events: `/content/events`, `/content/events/new`, `/content/events/[id]/edit`
- Media Library: `/media`
- Users (superadmin): `/users`
- Settings: `/pages/settings` and nested sections


## Authentication & Roles
- Sessions are validated via Supabase cookies (SSR)
- Middleware rules (`src/middleware.ts`):
  - Public-only routes: `/auth/sign-in`, `/auth/forgot-password`, `/auth/reset-password`
  - All other routes require a valid session
  - Profiles are fetched from `profiles` table to read `role`
  - Allowed roles: `admin`, `superadmin`
  - Superadmin-only prefixes: `/users`, `/system` (reserved)
  - Non-authorized users are redirected to `NEXT_PUBLIC_PUBLIC_WEBSITE_URL`


## Media Library
- Backed by Supabase Storage bucket: `media`
- Drag & drop uploads with automatic public URLs
- Logical folders: `news/`, `projects/`, `events/`, `uploads/`
- Grid/List views, search, sort, pagination-like navigation


## Audit Logs
- `POST /api/audit` records user actions (for authenticated users)
- `GET /api/audit` returns the latest logs (superadmin only)
- Captures basic metadata (IP, user agent) for traceability


## Styling & UI
- Tailwind CSS 3 with custom CSS variables and Satoshi font
- Accessible components via Radix primitives
- Smooth top progress via `nextjs-toploader`
- Dark mode supported via theme toggle


## Quality & Scripts
Scripts
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
```

Conventions
- TypeScript-first; prefer explicit, descriptive names
- Early returns and flat control flow
- Keep components focused; favor composition over bloating
- Accessibility: label interactive controls, keyboard-friendly


## Deployment
Vercel (recommended)
1. Import the repository into Vercel
2. Set environment variables
3. Deploy; Next.js middleware works out-of-the-box

Manual
```bash
npm run build
npm start
```


## Troubleshooting
- Redirect loop on protected routes: ensure auth cookies are present and valid
- Getting redirected to website: your profile `role` is not `admin`/`superadmin`
- Storage upload fails: verify Supabase Storage bucket `media` and RLS
- Missing images: check `next.config.mjs` image remote patterns if using external hosts
- Env vars not loading: confirm `.env.local` is placed under `admin-panel/`


## License
MIT © MecHack 