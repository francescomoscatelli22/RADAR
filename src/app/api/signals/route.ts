import { createClient } from "@supabase/supabase-js";
import { RECENT_WINDOWS, type Signal, type SignalKind, type SignalsResponse } from "@/lib/signals";

/*
  Dati VERI per l'intro: quanti contenuti ha raccolto Radar e gli ultimi per ogni formato.
  Il database ha la sicurezza a livello di riga (RLS) attiva e nessuna regola di lettura,
  quindi il browser non può leggerlo da solo: lo legge questo server con la chiave di servizio
  (che non lascia mai il server) e restituisce solo titoli, fonti e numeri.
*/

type Row = {
  title: string;
  published_at: string;
  meta: { points?: number; comments?: number } | null;
  sources: { name: string } | { name: string }[] | null;
};

const COLUMNS = "title, published_at, meta, sources(name)";

// "ComfyUI (release)" → "ComfyUI"; "Hacker News: generative AI" → "Hacker News"
function cleanSource(name: string) {
  return name.replace(/\s*\(release\)\s*$/i, "").replace(/^Hacker News:.*$/i, "Hacker News");
}

function toSignal(kind: SignalKind, row: Row): Signal {
  const src = Array.isArray(row.sources) ? row.sources[0] : row.sources;
  const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(row.published_at).getTime()) / 60000));
  return {
    kind,
    title: row.title,
    source: cleanSource(src?.name ?? ""),
    ageMinutes,
    ...(kind === "thread" ? { points: row.meta?.points ?? 0, comments: row.meta?.comments ?? 0 } : {}),
  };
}

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ error: "Database non configurato" }, { status: 503 });
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const latest = (platform: string, n: number) =>
    db.from("items").select(COLUMNS).eq("platform", platform).order("published_at", { ascending: false }).limit(n);

  // quanti segnali sono arrivati in ogni finestra di tempo (si conta soltanto, senza scaricare righe)
  const now = Date.now();
  const windowCounts = Promise.all(
    RECENT_WINDOWS.map(async (seconds) => {
      const since = new Date(now - seconds * 1000).toISOString();
      const res = await db.from("items").select("id", { count: "exact", head: true }).gte("created_at", since);
      return { seconds, count: res.error ? null : (res.count ?? 0) };
    }),
  );

  const [total, video, articles, thread, release, podcast, windows] = await Promise.all([
    // head: true = conta soltanto, senza scaricare le righe
    db.from("items").select("id", { count: "exact", head: true }),
    latest("youtube", 1),
    latest("article", 15),
    latest("hn", 1),
    latest("github", 1),
    latest("podcast", 1),
    windowCounts,
  ]);

  if (total.error || total.count === null) {
    return Response.json({ error: "Lettura non riuscita" }, { status: 502 });
  }

  const first = (res: { data: unknown }) => (res.data as Row[] | null)?.[0];
  const articleRows = (articles.data as Row[] | null) ?? [];
  const firstArticle = articleRows[0];
  // il secondo articolo viene da una fonte diversa, così i due blocchi non sono dello stesso sito
  const otherSource = (r: Row) => {
    const a = Array.isArray(r.sources) ? r.sources[0] : r.sources;
    const b = Array.isArray(firstArticle?.sources) ? firstArticle.sources[0] : firstArticle?.sources;
    return a?.name !== b?.name;
  };
  const secondArticle = articleRows.slice(1).find(otherSource) ?? articleRows[1];

  const items: Signal[] = [
    first(video) && toSignal("video", first(video)!),
    firstArticle && toSignal("article", firstArticle),
    secondArticle && toSignal("article", secondArticle),
    first(thread) && toSignal("thread", first(thread)!),
    first(release) && toSignal("release", first(release)!),
    first(podcast) && toSignal("podcast", first(podcast)!),
  ].filter((s): s is Signal => Boolean(s));

  // la finestra più stretta con almeno un segnale (le finestre sono in ordine crescente)
  const hit = windows.find((w) => (w.count ?? 0) > 0);
  const recent = hit ? { count: hit.count as number, seconds: hit.seconds } : null;

  const body: SignalsResponse = { recent, count: total.count, items };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
