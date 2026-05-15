# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

Doral is a Next.js 14 (App Router) app deployed to Vercel. It clones the look of cityofdoral.com and adds an AI chat widget, an admin dashboard, and an analytics page. The backend is Supabase; LLMs are Groq (primary) and Gemini (fallback), with OpenAI for embeddings.

This is a **demo-driven POC for an RFP bid** to the City of Doral, FL — not a production build. Optimize for demo-day reliability and visible polish. The 30-minute live demo to the evaluation committee is the deliverable.

## RFP-Driven Requirements (non-negotiable)

- **Bilingual EN/ES parity** — Spanish is a scoring factor, not nice-to-have. All seed FAQ content in both languages. UI + chat must honor a user language toggle and respond to mid-conversation switches.
- **Multi-source retrieval (§3.2)** — Bot must answer from **both** cityofdoral.com and **doralpd.com** (Police Dept). Tag every embedded chunk with `domain` / `source_url`. Citations in UI must show which domain answered.
- **Visual fidelity** — Pixel-close clone of cityofdoral.com. Real palette sampled from production CSS: **navy `#052942`** primary, **slate `#41596b`** secondary, **gold `#FFCF4B`** accent. Use real Doral service names, not placeholders.
- **WCAG 2.1 AA** — full keyboard nav, ARIA live regions for streamed messages, color contrast verified.

## Surfaces

- `/` — Public homepage. Visual goal: faithful look-alike of cityofdoral.com. Floating chat widget anchored bottom-right.
- `/admin` — Auth-gated. Used to upload PDFs, manage FAQ/content, trigger scrape/embed jobs.
- `/analytics` — Power BI-style dashboards over chat/usage data. Should feel like a BI tool, not a generic admin table.

## Backend (Supabase)

- **Postgres + pgvector** — stores FAQ, scraped content, and embeddings. Vector search powers the chat retrieval step.
- **Auth** — admin login only; public site is unauthenticated.
- **Storage** — uploaded PDFs from admins.
- **Edge Functions** — `chat`, `scrape`, `embed`. Keep LLM calls server-side; never expose provider keys to the browser.
- **Realtime** — live updates to admin dashboard and analytics.

## LLM Routing

1. Try **Groq Llama 3.3 70B** first (latency-optimized). Currently disabled — user has no Groq key yet; `GROQ_API_KEY` is blank so the chat function skips Groq and goes straight to Gemini.
2. **Gemini 2.5 Flash** is the current default and fallback. Note: `gemini-2.0-flash` returned quota=0 on this API key, so we use `gemini-2.5-flash` which has free-tier availability.
3. Embeddings always use **OpenAI `text-embedding-3`** — do not switch providers mid-corpus without a re-embed plan, since vectors are not cross-compatible.

## Current State (Phase 2 complete)

**Built (cumulative):**
- DB tables: `conversations`, `messages` (Phase 1); `faqs`, `site_content` with nullable `embedding vector(1536)` and generated `tsv tsvector` (Phase 2). RLS open to anon for POC.
- `match_content(query_text, match_count, filter_lang)` RPC: Postgres full-text search via `websearch_to_tsquery('simple', ...)` + `ts_rank_cd`, unioned across `faqs` and `site_content`, language-filtered.
- 40 seeded FAQ rows (20 topics × EN/ES) covering BTR, permits, 311, parks, trolley, hurricane, code, garbage, police non-emergency, crime mapping, Citizens Police Academy, Special Needs Registry, City Hall, council, jobs, public records, Doral Cast and Connect, elections, mayor, water billing.
- Edge Functions deployed: `hello` (smoke), `chat` (retrieves top-5 hits via `match_content`, injects as CONTEXT into the system prompt, returns `citations[]` alongside the reply; Groq → Gemini failover, currently Gemini only).
- Homepage clone of cityofdoral.com at `/` — utility bar, header w/ real logo, primary nav, hero w/ real city photo, Top Services, I Want To…, Events, News, Elected Officials (real names + photos), By The Numbers, Footer.
- `ChatWidget` (bottom-right): EN/ES toggle, LLM provider badge, **citation chips** with a colored dot per domain (gold = cityofdoral.com, red = doralpd.com) that open the source URL in a new tab.
- Seed pipeline: `scripts/faqs.json` + `scripts/seed-faqs.mjs` (no embeddings — FTS-only). Invoked via `npm run seed:faqs`.
- Real branding assets in `public/doral/`.

**Why FTS instead of pgvector now:** the user's OpenAI key is `insufficient_quota`, so we can't generate embeddings. FTS is sufficient for the demo's small corpus. Vector columns are kept nullable so we can re-embed and switch to vector search in one migration when OpenAI billing is enabled (or by swapping to Gemini embeddings).

**Known caveats:**
- FTS uses `simple` config (no stemming) — exact-word matching across languages. Service-name queries work well; pure paraphrase queries less so.
- News + events cards have real headlines but no images.
- Council seats: verify current officials before demo.
- `supabase/functions/` is excluded from Next.js TS build (Deno runtime).

**Next — Phase 3:** Polished chat widget (see plan below).

## Phase Plan (12 phases, ~3 days each)

Strategy: end-to-end thin slice first, then RAG, then visual polish, then features, then analytics, then channels, then a11y. **Non-negotiable for a credible demo:** Phases 1, 2, 4, 5, 10. **Scoring boosters:** 3, 6, 7, 8, 9, 11. **Always done:** 12.

- **Phase 0 — Foundation** ✅ Next.js + Tailwind + Supabase wired; `hello` Edge Function round-trip verified.
- **Phase 1 — Thin-slice chat** ✅ `conversations`/`messages` tables; `chat` Edge Function with Groq→Gemini failover; basic widget; persists turns; LLM badge.
- **Phase 2 — RAG + knowledge base** ✅ `faqs`/`site_content` with FTS (vector path kept as upgrade hook); `match_content` RPC; 40 EN/ES FAQs seeded; chat injects context; citation chips per domain.
- **Phase 3 — Polished chat widget** ⏳ Quick-reply chips on welcome, streaming responses (Gemini `streamGenerateContent`), typing indicator, smooth framer-motion animations, star rating after 3+ exchanges, file/voice icons (UI only), full keyboard nav + ARIA labels.
- **Phase 4 — Workflows** Pothole/311 report (location → description → photo → ticket number written to `service_requests`); BTR renewal walkthrough; sentiment-triggered human handoff; mid-conversation language switch verified across flows.
- **Phase 5 — Document parsing** Paperclip-icon upload in chat → Supabase Storage; Edge Function parses PDFs with `pdf-parse` into `uploaded_documents`; bot answers against the uploaded doc. Ship a sample Doral permit PDF in `/public` for an instant demo.
- **Phase 6 — Multi-URL cross-site retrieval (§3.2)** Seed ~10 chunks of doralpd.com content (Crime Mapping, Citizens Police Academy, Special Needs Registry) into `site_content`. Verify a question like *"How do I report a break-in and install a security camera?"* cites both domains.
- **Phase 7 — Scraping pipeline** `sources` table; `scrape` Edge Function (fetch → chunk → embed/index → upsert); pg_cron at 3am ET; manual "Re-scrape now" button; per-URL last-scraped timestamp.
- **Phase 8 — Admin dashboard** Supabase Auth gate at `/admin`; FAQ CRUD with side-by-side EN/ES editing; announcements CRUD with priority + active toggle; sources list with re-scrape buttons; service requests table with filters; conversation viewer.
- **Phase 9 — Power BI-style analytics** `/analytics` with Recharts: KPI cards (conversations, satisfaction, resolution, top intent), conversations/day line, intent bar, EN/ES pie, sentiment stacked bar, **LLM provider split** (proves failover), CSV export, "Connect to Power BI" mock button.
- **Phase 10 — SMS channel demo (§3.2 omnichannel)** `/sms-demo` phone-mockup page. "Continue via SMS" button hands off the same `conversation_id`. Real Twilio if keys present; otherwise simulated.
- **Phase 11 — Accessibility + demo polish** WCAG 2.1 AA audit (keyboard, screen reader, contrast), `aria-live` for streamed messages, skip-to-content, `/accessibility` page documenting conformance, `?demo=true` URL param (auto-opens chat, demo badge, scripted prompts sidebar), `/demo-script` page, `npm run seed:reset` to restore clean demo state.

## Conventions

- App Router (`app/` directory), React Server Components by default; mark client components explicitly.
- Server-side secrets in Edge Functions or Next.js server routes only. `NEXT_PUBLIC_*` is for browser-safe values.
- Database access from the browser uses the anon key + RLS; service-role key is server-only.

## Commands

```bash
npm run dev          # local dev
npm run build        # production build
npm run lint         # lint
npm run seed:faqs    # repopulate the faqs table from scripts/faqs.json
```
