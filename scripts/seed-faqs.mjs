#!/usr/bin/env node
// Seed FAQs into Supabase. Phase 2 uses Postgres FTS (no embedding API needed).
// The tsvector column on `faqs` is generated automatically from question + answer.

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

async function loadEnvLocal() {
  try {
    const text = await readFile(resolve(root, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* ignore */
  }
}

await loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const raw = await readFile(resolve(root, "scripts/faqs.json"), "utf8");
  const faqs = JSON.parse(raw);

  console.log(`Loaded ${faqs.length} FAQ topics. Inserting ${faqs.length * 2} rows…`);

  const { error: delErr } = await supabase
    .from("faqs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.warn("Warning: delete existing faqs failed:", delErr.message);

  const rows = [];
  for (const f of faqs) {
    for (const lang of ["en", "es"]) {
      rows.push({
        lang,
        question: f[lang].question,
        answer: f[lang].answer,
        category: f.category,
        domain: f.domain,
        source_url: f.source_url,
      });
    }
  }

  const { error } = await supabase.from("faqs").insert(rows);
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Inserted ${rows.length} FAQ rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
