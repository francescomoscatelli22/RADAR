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
    db
      .from("items")
      .select(COLUMNS)
      .eq("platform", platform)
      .order("published_at", { ascending: false })
      // stesso filtro del feed: tag tecnici di build non sono release da mostrare
      .not("title", "like", "ciflow/%")
      .not("title", "like", "trunk/%")
      .not("title", "ilike", "%alpha%")
      .not("title", "ilike", "%nightly%")
      .not("title", "like", "viable/%")
      .not("title", "match", "^b[0-9]+")
      .limit(n);

  // quanti segnali sono arrivati in ogni finestra di tempo (si conta soltanto, senza scaricare righe)
  const now = Date.now();
  const windowCounts = Promise.all(
    RECENT_WINDOWS.map(async (seconds) => {
      const since = new Date(now - seconds * 1000).toISOString();
      // si conta per data di PUBBLICAZIONE (quando il contenuto è uscito davvero), non per data di raccolta:
      // altrimenti un caricamento in blocco dell'archivio sembrerebbe "N segnali negli ultimi 5 minuti"
      const res = await db
        .from("items")
        .select("id", { count: "exact", head: true })
        .gte("published_at", since)
        .lte("published_at", new Date(now).toISOString());
      return { seconds, count: res.error ? null : (res.count ?? 0) };
    }),
  );

  const [total, video, articles, thread, release, podcast, windows] = await Promise.all([
    // head: true = conta soltanto, senza scaricare le righe
    db.from("items").select("id", { count: "exact", head: true }),
    latest("youtube", 8),
    latest("article", 12),
    latest("hn", 8),
    latest("github", 8),
    latest("podcast", 8),
    windowCounts,
  ]);

  if (total.error || total.count === null) {
    return Response.json({ error: "Lettura non riuscita" }, { status: 502 });
  }

  // Gli ultimi contenuti veri in ordine cronologico, dal più recente: si mescolano tutti i
  // formati e si prendono i primi, al massimo 2 per formato così il poster resta vario.
  const pool: { kind: SignalKind; row: Row }[] = [
    ...((video.data as Row[] | null) ?? []).map((row) => ({ kind: "video" as const, row })),
    ...((articles.data as Row[] | null) ?? []).map((row) => ({ kind: "article" as const, row })),
    ...((thread.data as Row[] | null) ?? []).map((row) => ({ kind: "thread" as const, row })),
    ...((release.data as Row[] | null) ?? []).map((row) => ({ kind: "release" as const, row })),
    ...((podcast.data as Row[] | null) ?? []).map((row) => ({ kind: "podcast" as const, row })),
  ].sort((a, b) => new Date(b.row.published_at).getTime() - new Date(a.row.published_at).getTime());

  const perKind: Partial<Record<SignalKind, number>> = {};
  const items: Signal[] = [];
  for (const { kind, row } of pool) {
    if ((perKind[kind] ?? 0) >= 2) continue;
    perKind[kind] = (perKind[kind] ?? 0) + 1;
    items.push(toSignal(kind, row));
    if (items.length === 6) break;
  }

  // solo le finestre contate davvero (se una lettura è fallita, si salta: mai numeri inventati)
  const counted = windows.flatMap((w) => (w.count === null ? [] : [{ seconds: w.seconds, count: w.count }]));

  const body: SignalsResponse = { windows: counted, count: total.count, items };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
