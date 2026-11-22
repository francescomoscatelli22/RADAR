import { serverDb } from "@/lib/server/db";
import { attachTranslations } from "@/lib/server/translate";
import { isLang } from "@/lib/languages";
import {
  FORMAT_PLATFORM,
  cleanSourceName,
  expandTopics,
  type FeedItem,
  type FeedPage,
  type Format,
  type Platform,
  type TopicNode,
} from "@/lib/feed";

/*
  Il feed cronologico. Parametri (tutti facoltativi):
   - topics   = slug degli argomenti scelti, separati da virgola (i gruppi includono i figli)
   - format   = video | article | podcast | thread | release
   - sources  = id delle fonti seguite, separati da virgola
   - lang     = it | en: lingua dell'utente; titoli e anteprime scritti in altre lingue arrivano tradotti (campo "tr")
   - cursor   = "ISO~id" dell'ultimo elemento già visto (paginazione)
   - limit    = quanti elementi (default 20, massimo 40)
*/

type Row = {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  published_at: string;
  summary: string;
  image_url: string | null;
  topics: string[];
  lang: string | null;
  meta: Record<string, unknown> | null;
  source_id: string;
  sources: { name: string } | { name: string }[] | null;
};

const COLUMNS = "id, platform, title, url, published_at, summary, image_url, topics, lang, meta, source_id, sources(name)";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,60}$/;

// l'albero degli argomenti cambia di rado: lo teniamo in memoria 10 minuti
let treeCache: { at: number; nodes: Pick<TopicNode, "slug" | "parent">[] } | null = null;

async function topicTree(db: NonNullable<ReturnType<typeof serverDb>>) {
  if (treeCache && Date.now() - treeCache.at < 10 * 60_000) return treeCache.nodes;
  const { data } = await db.from("topics").select("slug, parent_slug");
  const nodes = (data ?? []).map((t) => ({ slug: t.slug as string, parent: (t.parent_slug as string | null) ?? null }));
  if (nodes.length) treeCache = { at: Date.now(), nodes };
  return nodes;
}

function list(value: string | null, test: RegExp, max: number) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => test.test(s))
    .slice(0, max);
}

function toItem(r: Row): FeedItem {
  const src = Array.isArray(r.sources) ? r.sources[0] : r.sources;
  const m = r.meta ?? {};
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  return {
    id: r.id,
    platform: r.platform,
    title: r.title,
    url: r.url,
    publishedAt: r.published_at,
    summary: r.summary,
    image: r.image_url,
    topics: r.topics,
    lang: r.lang,
    source: { id: r.source_id, name: cleanSourceName(src?.name ?? "") },
    meta: {
      duration: str(m.duration),
      points: num(m.points),
      comments: num(m.comments),
      discussionUrl: str(m.discussion_url),
      releaseTitle: str(m.release_title),
    },
  };
}

// tradurre una pagina intera la prima volta richiede qualche secondo
export const maxDuration = 30;

export async function GET(request: Request) {
  const db = serverDb();
  if (!db) return Response.json({ error: "Database non configurato" }, { status: 503 });

  const p = new URL(request.url).searchParams;
  const limit = Math.min(40, Math.max(1, Number(p.get("limit")) || 20));
  const topics = list(p.get("topics"), SLUG, 150);
  const sources = list(p.get("sources"), UUID, 100);
  const format = p.get("format") as Format | null;

  let query = db
    .from("items")
    .select(COLUMNS)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    // rumore tecnico dei repository (tag di build, nightly, alpha): non sono release da leggere
    .not("title", "like", "ciflow/%")
    .not("title", "like", "trunk/%")
    .not("title", "ilike", "%alpha%")
    .not("title", "ilike", "%nightly%")
    .not("title", "like", "viable/%")
    .not("title", "match", "^b[0-9]+")
    .limit(limit + 1); // uno in più: serve a sapere se c'è una pagina dopo

  if (topics.length) query = query.overlaps("topics", expandTopics(topics, await topicTree(db)));
  if (sources.length) query = query.in("source_id", sources);
  if (format && format !== "all" && format in FORMAT_PLATFORM) query = query.eq("platform", FORMAT_PLATFORM[format]);

  const cursor = p.get("cursor");
  if (cursor) {
    const [ts, id] = cursor.split("~");
    const date = new Date(ts);
    if (!Number.isNaN(date.getTime()) && UUID.test(id ?? "")) {
      const iso = date.toISOString();
      query = query.or(`published_at.lt.${iso},and(published_at.eq.${iso},id.lt.${id})`);
    }
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: "Lettura non riuscita" }, { status: 502 });

  const rows = (data ?? []) as unknown as Row[];
  const more = rows.length > limit;
  // lo stesso link può essere stato raccolto da due fonti: se ne mostra uno solo
  const seenUrls = new Set<string>();
  const page = rows.slice(0, limit).filter((r) => !seenUrls.has(r.url) && seenUrls.add(r.url));
  const last = page[page.length - 1];
  const items = page.map(toItem);
  // lingua scelta dall'utente: i contenuti scritti in un'altra lingua arrivano con titolo e anteprima tradotti
  const lang = p.get("lang");
  if (isLang(lang)) await attachTranslations(db, items, lang);
  const body: FeedPage = {
    items,
    next: more && last ? `${new Date(last.published_at).toISOString()}~${last.id}` : null,
  };
  return Response.json(body, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
