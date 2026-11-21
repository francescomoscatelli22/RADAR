/*
  Tipi e piccole funzioni condivise tra server e interfaccia per il feed.
  Nessuna dipendenza da React o da Next.js.
*/

export type Platform = "youtube" | "article" | "podcast" | "github" | "hn";

export type FeedItem = {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  publishedAt: string; // ISO
  summary: string;
  image: string | null;
  topics: string[];
  source: { id: string; name: string };
  meta: {
    duration?: string; // podcast "34:12" o secondi
    points?: number; // thread
    comments?: number; // thread
    discussionUrl?: string; // thread
    releaseTitle?: string; // release
  };
};

export type FeedPage = {
  items: FeedItem[];
  next: string | null; // cursore per la pagina dopo, null = finito
};

export type TopicNode = {
  slug: string;
  label: string;
  parent: string | null;
  order: number;
};

export type SourceInfo = {
  ids: string[]; // di solito una; "Hacker News" raggruppa più ricerche
  name: string;
  platform: Platform;
};

/** Formati che l'utente vede (filtro principale) e come si chiamano nell'interfaccia. */
export type Format = "all" | "video" | "article" | "podcast" | "thread" | "release";

export const FORMAT_PLATFORM: Record<Exclude<Format, "all">, Platform> = {
  video: "youtube",
  article: "article",
  podcast: "podcast",
  thread: "hn",
  release: "github",
};

export const PLATFORM_FORMAT: Record<Platform, Exclude<Format, "all">> = {
  youtube: "video",
  article: "article",
  podcast: "podcast",
  hn: "thread",
  github: "release",
};

export const FORMAT_LABEL: Record<Format, string> = {
  all: "Tutto",
  video: "Video",
  article: "Articoli",
  podcast: "Podcast",
  thread: "Thread",
  release: "Release",
};

/** "ComfyUI (release)" → "ComfyUI"; "Hacker News: generative AI" → "Hacker News". */
export function cleanSourceName(name: string) {
  return name.replace(/\s*\(release\)\s*$/i, "").replace(/^Hacker News:.*$/i, "Hacker News");
}

/** "5 min", "3 h", "2 g", "4 sett" — da quanto è uscito un contenuto. */
export function timeAgo(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ora";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} g`;
  const w = Math.round(d / 7);
  if (w < 9) return `${w} sett`;
  return `${Math.round(d / 30)} mesi`;
}

/**
 * Miniatura leggera: le immagini dei siti (e soprattutto le copertine dei podcast, spesso 3000×3000)
 * passano dal servizio gratuito wsrv.nl, che le rimpicciolisce alla misura vera e le converte in WebP.
 * Esempio: una copertina da 2 MB diventa ~8 KB. Le miniature di YouTube sono già leggere: restano dirette.
 * Se wsrv.nl non risponde, la card usa l'originale (vedi Thumb in FeedCard).
 */
export function thumbUrl(src: string, width: number, height?: number) {
  try {
    const { protocol, hostname } = new URL(src);
    if (!protocol.startsWith("http") || hostname.endsWith("ytimg.com")) return src;
  } catch {
    return src;
  }
  const qs = new URLSearchParams({ url: src, w: String(width), dpr: "2", output: "webp", q: "72", maxage: "14d" });
  if (height) {
    qs.set("h", String(height));
    qs.set("fit", "cover");
  }
  return `https://wsrv.nl/?${qs}`;
}

/** "Oggi", "Ieri" o "lunedì 18 novembre": l'etichetta del giorno nel feed. */
export function dayLabel(iso: string, now = Date.now()) {
  const d = new Date(iso);
  const start = (t: number) => {
    const x = new Date(t);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const diff = Math.round((start(now) - start(d.getTime())) / 86_400_000);
  if (diff <= 0) return "Oggi";
  if (diff === 1) return "Ieri";
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(new Date(now).getFullYear() !== d.getFullYear() ? { year: "numeric" } : {}),
  }).format(d);
}

/** Durata di un podcast: "2054" (secondi) o "34:12" → "34 min". */
export function prettyDuration(raw?: string) {
  if (!raw) return null;
  let sec: number;
  if (/^\d+$/.test(raw)) sec = Number(raw);
  else {
    const parts = raw.split(":").map(Number);
    if (parts.some(Number.isNaN)) return null;
    sec = parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  if (!sec) return null;
  const min = Math.round(sec / 60);
  if (min < 60) return `${Math.max(1, min)} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

/**
 * Dai slug scelti dall'utente a tutti gli slug da cercare: un argomento "gruppo"
 * (es. AI generativa) include i suoi sotto-argomenti. La radice "ai" no: sarebbe tutto.
 */
export function expandTopics(selected: string[], nodes: Pick<TopicNode, "slug" | "parent">[]) {
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parent) continue;
    const list = children.get(n.parent) ?? [];
    list.push(n.slug);
    children.set(n.parent, list);
  }
  const out = new Set<string>();
  const visit = (slug: string, expand: boolean) => {
    out.add(slug);
    if (!expand) return;
    for (const c of children.get(slug) ?? []) if (!out.has(c)) visit(c, true);
  };
  for (const s of selected) visit(s, s !== "ai");
  return [...out];
}
