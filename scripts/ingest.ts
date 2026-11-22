// Raccolta dei contenuti. Si lancia con:
//   npm run ingest:dry   -> prova senza database: legge scripts/seed/*.json e stampa cosa trova
//   npm run ingest       -> legge le fonti dal database (Supabase) e salva i contenuti nuovi
//   npm run ingest -- --seed   -> prima carica argomenti e fonti da scripts/seed/*.json nel database
//   npm run ingest -- --backfill-lang   -> una volta sola: assegna la lingua ai contenuti già salvati
// Su GitHub Actions gira da solo ogni 30 minuti (.github/workflows/ingest.yml).

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildMatchers, collectSource, detectLang } from "../src/lib/ingest";
import type { Item, Source, Topic } from "../src/lib/ingest";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const SEED = args.has("--seed");
const CONCURRENCY = 4;

function readSeed<T>(file: string): T {
  return JSON.parse(readFileSync(new URL(`./seed/${file}`, import.meta.url), "utf8")) as T;
}

function dbClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Mancano SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (mettili in .env.local). Per provare senza database: npm run ingest:dry",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Esegue `worker` su tutti gli elementi, al massimo `limit` alla volta. */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) await worker(next);
    }),
  );
}

/**
 * Una volta sola, dopo aver aggiunto la colonna "lang": assegna la lingua ai contenuti già nel database
 * (quelli raccolti dopo la ricevono da soli). Si guarda il testo di ogni fonte intera, come in raccolta.
 */
async function backfillLang(db: SupabaseClient) {
  const s = await db.from("sources").select("id, name");
  if (s.error) throw s.error;
  const counts: Record<string, number> = {};
  for (const source of s.data as { id: string; name: string }[]) {
    const r = await db
      .from("items")
      .select("title, summary")
      .eq("source_id", source.id)
      .order("published_at", { ascending: false })
      .limit(40);
    if (r.error) throw r.error;
    const rows = r.data as { title: string; summary: string }[];
    const lang = detectLang(rows.map((i) => `${i.title}. ${i.summary}`));
    if (!lang) continue;
    const u = await db.from("items").update({ lang }).eq("source_id", source.id).is("lang", null);
    if (u.error) throw u.error;
    counts[lang] = (counts[lang] ?? 0) + 1;
  }
  console.log("Lingue assegnate (fonti per lingua):", counts);
}

async function main() {
  if (args.has("--backfill-lang")) {
    await backfillLang(dbClient());
    return;
  }
  let topics: Topic[];
  let sources: Source[];
  let db: SupabaseClient | null = null;

  if (DRY) {
    topics = readSeed<Topic[]>("topics.json");
    sources = readSeed<Omit<Source, "id" | "active">[]>("sources.json").map((s) => ({
      ...s,
      id: s.url,
      active: true,
    }));
  } else {
    db = dbClient();
    if (SEED) {
      const t = await db.from("topics").upsert(readSeed<Topic[]>("topics.json"), { onConflict: "slug" });
      if (t.error) throw t.error;
      const s = await db.from("sources").upsert(readSeed<unknown[]>("sources.json"), { onConflict: "url" });
      if (s.error) throw s.error;
      console.log("Argomenti e fonti caricati nel database.");
    }
    const t = await db.from("topics").select("*");
    if (t.error) throw t.error;
    const s = await db.from("sources").select("*").eq("active", true);
    if (s.error) throw s.error;
    topics = t.data as Topic[];
    sources = s.data as Source[];
  }

  const matchers = buildMatchers(topics);
  let totalItems = 0;
  let failed = 0;

  await pool(sources, CONCURRENCY, async (source) => {
    let items: Item[] = [];
    let error: string | null = null;
    try {
      items = await collectSource(source, matchers);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      failed++;
    }

    if (DRY) {
      console.log(`\n● ${source.name} [${source.platform}] — ${error ? `ERRORE: ${error}` : `${items.length} contenuti`}`);
      for (const i of items.slice(0, 3)) {
        console.log(`   ${i.published_at.slice(0, 10)}  ${i.title.slice(0, 70)}`);
        console.log(`      argomenti: ${i.topics.join(", ")}  |  lingua: ${i.lang ?? "?"}  |  immagine: ${i.image_url ? "sì" : "no"}`);
        if (i.summary) console.log(`      "${i.summary.slice(0, 100)}"`);
      }
    } else if (db) {
      if (items.length > 0) {
        // ignoreDuplicates: un contenuto già salvato non viene riscritto.
        const rows = items.map((i) => ({ ...i, source_id: source.id }));
        const res = await db
          .from("items")
          .upsert(rows, { onConflict: "source_id,external_id", ignoreDuplicates: true });
        if (res.error) error = `salvataggio: ${res.error.message}`;
      }
      await db
        .from("sources")
        .update({ last_fetched_at: new Date().toISOString(), last_error: error })
        .eq("id", source.id);
      console.log(`${error ? "✗" : "✓"} ${source.name}: ${items.length} contenuti${error ? ` — ${error}` : ""}`);
    }
    totalItems += items.length;
  });

  console.log(`\nFatto: ${sources.length} fonti, ${totalItems} contenuti, ${failed} fonti con errore.`);
  // Fallisce solo se NESSUNA fonte ha funzionato (così una fonte rotta non blocca le altre).
  if (sources.length > 0 && failed === sources.length) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
