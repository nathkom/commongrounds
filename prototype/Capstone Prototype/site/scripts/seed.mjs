#!/usr/bin/env node
/**
 * One-time seed: reads src/data/events.js and bulk-upserts into Supabase.
 * Run from site/ directory: node scripts/seed.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env vars from .env.local ─────────────────────────────────────────────
function loadEnv(filename) {
  try {
    const text = readFileSync(resolve(__dirname, "..", filename), "utf8");
    const env = {};
    for (const line of text.split("\n")) {
      const m = line.match(/^([^#=][^=]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const supabaseUrl = env.VITE_SUPABASE_URL;
// Service role key bypasses RLS — pass via env var or add to .env.local as SUPABASE_SERVICE_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  process.exit(1);
}

// ── Load events from static data file ────────────────────────────────────────
// Replaces Vite-only `import.meta.env.BASE_URL` with "/" so eval works in Node
let src = readFileSync(resolve(__dirname, "../src/data/events.js"), "utf8");
src = src
  .replace(/\$\{import\.meta\.env\.BASE_URL\}/g, "/")
  .replace(/^export const events\s*=\s*/, "");
src = src.replace(/;\s*$/, ""); // strip trailing semicolon

// eslint-disable-next-line no-eval
const events = eval("(" + src + ")");

// ── Build rows ────────────────────────────────────────────────────────────────
const rows = events.map((e) => ({
  id:                e.id,
  title:             e.title,
  space_name:        e.space_name ?? null,
  neighborhood:      e.neighborhood ?? null,
  category:          e.category ?? null,
  description:       e.description ?? null,
  date:              e.date ?? null,
  time:              e.time ?? null,
  cost:              e.cost ?? null,
  cost_amount:       e.cost_amount != null ? parseFloat(String(e.cost_amount).replace(/^\$/, "")) || null : null,
  image_url:         e.image_url ?? null,
  gallery_images:    e.gallery_images ?? [],
  accessibility:     e.accessibility ?? [],
  tags:              e.tags ?? [],
  featured:          e.featured ?? false,
  noise_level:       e.noise_level ?? null,
  accessibility_info: e.accessibility_info ?? null,
  space_format:      e.space_format ?? null,
  crowd_level:       e.crowd_level ?? null,
  attending_count:   e.attending_count ?? 0,
  attending_limit:   e.attending_limit ?? null,
  show_attendance:   e.show_attendance ?? false,
  likes:             e.likes ?? 0,
  contact_email:     e.contact_email ?? null,
  host_id:           null,
}));

// ── Upsert ────────────────────────────────────────────────────────────────────
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`Seeding ${rows.length} events…`);
const { error } = await supabase.from("events").upsert(rows, { onConflict: "id" });

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Done! ${rows.length} events are now in Supabase.`);
