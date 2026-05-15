# Doral

A Doral homepage clone (look-alike of cityofdoral.com) with an integrated AI chat widget, admin dashboard, and analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router) on Vercel                      │
│  ├─ Doral homepage clone (cityofdoral.com look-alike)   │
│  ├─ Floating chat widget (bottom-left)                  │
│  ├─ Admin dashboard (/admin)                            │
│  └─ Power BI-style analytics page (/analytics)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase                                               │
│  ├─ Postgres + pgvector (embeddings, FAQ, content)      │
│  ├─ Auth (admin login)                                  │
│  ├─ Storage (uploaded PDFs)                             │
│  ├─ Edge Functions (chat, scrape, embed)                │
│  └─ Realtime (live dashboard updates)                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────┬──────────────────┬───────────────────┐
│  Groq (primary)  │ Gemini (backup)  │ OpenAI embeddings │
│  Llama 3.3 70B   │ Flash 2.0        │ text-embedding-3  │
└──────────────────┴──────────────────┴───────────────────┘
```

## Tech Stack

- **Frontend / hosting**: Next.js 14 (App Router), deployed on Vercel
- **Backend**: Supabase (Postgres + pgvector, Auth, Storage, Edge Functions, Realtime)
- **LLMs**: Groq Llama 3.3 70B (primary), Gemini Flash 2.0 (fallback)
- **Embeddings**: OpenAI `text-embedding-3`

## Surfaces

- `/` — Public homepage with floating chat widget (bottom-left)
- `/admin` — Authenticated admin dashboard (PDF uploads, content management)
- `/analytics` — Power BI-style analytics page

## Getting Started

```bash
npm install
npm run dev
```

Environment variables required (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```
