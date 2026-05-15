# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

Doral is a Next.js 14 (App Router) app deployed to Vercel. It clones the look of cityofdoral.com and adds an AI chat widget, an admin dashboard, and an analytics page. The backend is Supabase; LLMs are Groq (primary) and Gemini (fallback), with OpenAI for embeddings.

This is a **demo-driven POC for an RFP bid** to the City of Doral, FL — not a production build. Optimize for demo-day reliability and visible polish. The 30-minute live demo to the evaluation committee is the deliverable.

## RFP-Driven Requirements (non-negotiable)

- **Bilingual EN/ES parity** — Spanish is a scoring factor, not nice-to-have. All seed FAQ content in both languages. UI + chat must honor a user language toggle and respond to mid-conversation switches.
- **Multi-source retrieval (§3.2)** — Bot must answer from **both** cityofdoral.com and **doralpd.com** (Police Dept). Tag every embedded chunk with `domain` / `source_url`. Citations in UI must show which domain answered.
- **Visual fidelity** — Pixel-close clone of cityofdoral.com. Palette: **navy `#003366`** primary, **gold `#FDB913`** accent. Use real Doral service names, not placeholders.
- **WCAG 2.1 AA** — full keyboard nav, ARIA live regions for streamed messages, color contrast verified.

## Surfaces

- `/` — Public homepage. Visual goal: faithful look-alike of cityofdoral.com. Floating chat widget anchored bottom-left.
- `/admin` — Auth-gated. Used to upload PDFs, manage FAQ/content, trigger scrape/embed jobs.
- `/analytics` — Power BI-style dashboards over chat/usage data. Should feel like a BI tool, not a generic admin table.

## Backend (Supabase)

- **Postgres + pgvector** — stores FAQ, scraped content, and embeddings. Vector search powers the chat retrieval step.
- **Auth** — admin login only; public site is unauthenticated.
- **Storage** — uploaded PDFs from admins.
- **Edge Functions** — `chat`, `scrape`, `embed`. Keep LLM calls server-side; never expose provider keys to the browser.
- **Realtime** — live updates to admin dashboard and analytics.

## LLM Routing

1. Try **Groq Llama 3.3 70B** first (latency-optimized).
2. On failure/timeout, fall back to **Gemini Flash 2.0**.
3. Embeddings always use **OpenAI `text-embedding-3`** — do not switch providers mid-corpus without a re-embed plan, since vectors are not cross-compatible.

## Conventions

- App Router (`app/` directory), React Server Components by default; mark client components explicitly.
- Server-side secrets in Edge Functions or Next.js server routes only. `NEXT_PUBLIC_*` is for browser-safe values.
- Database access from the browser uses the anon key + RLS; service-role key is server-only.

## Commands

```bash
npm run dev      # local dev
npm run build    # production build
npm run lint     # lint
```

(Update as scripts are added.)
