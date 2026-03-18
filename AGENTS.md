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
