# AXION Cred - Agentes Documentation

## Project Overview
AXION is a SaaS credit management platform for small businesses. Built with Next.js 14 (App Router), tRPC, and Supabase.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, React Query
- **Backend**: Node.js with tRPC (type-safe API)
- **Database**: PostgreSQL (Supabase) with RLS
- **Authentication**: Supabase Auth

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── dashboard/      # Dashboard home
│   │   ├── customers/      # Customer management
│   │   └── loans/          # Loan management
│   └── api/trpc/           # tRPC API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   └── dashboard/           # Dashboard-specific components
├── lib/                    # Utilities
├── server/
│   ├── db/                 # Database schema (SQL)
│   ├── routers/            # tRPC routers
│   ├── trpc.ts             # tRPC setup
│   └── supabase.ts         # Supabase server client
├── trpc/                   # tRPC client
└── types/                  # TypeScript types
```

## Running the Project
```bash
npm run dev
```

## Database Setup
Run the SQL in `src/server/db/schema.sql` in your Supabase project.

## Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Vercel Deployment

### Environment Variables in Vercel
Add the following environment variables in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ogtbegrzbuzophdcdpjm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndGJlZ3J6YnV6b3BoZGNkcGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzEzNDcsImV4cCI6MjA4OTQ0NzM0N30.MuVFIrF2Dw6a6ZqbqNGW95n1_1w1mLoo2BmoHPawoDw` |

### Supabase Setup Steps
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your URL and anon key
3. Run the SQL schema in `src/server/db/schema.sql` via the Supabase SQL Editor
4. Add the environment variables to Vercel
5. Redeploy your project
