// Lettore di feed RSS 2.0 e Atom. Gestisce anche le varianti di YouTube,
// GitHub (release) e dei podcast, trasformandole nel formato unico RawItem.

import { XMLParser } from "fast-xml-parser";
import type { Platform, RawItem } from "./types";

const MAX_ITEMS_PER_SOURCE = 30;
const SUMMARY_MAX_CHARS = 300;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  // Questi tag possono comparire più volte: li vogliamo sempre come elenco.
  isArray: (name) => ["item", "entry", "link", "media:thumbnail", "enclosure"].includes(name),
});

type Node = Record<string, unknown>;

/** Estrae il testo da un nodo XML, che può essere stringa, numero o oggetto con attributi. */
function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in (value as Node)) {
    return text((value as Node)["#text"]);
  }
  return "";
}

function attr(value: unknown, name: string): string {
  if (value && typeof value === "object") {
    const v = (value as Node)[`@_${name}`];
    if (typeof v === "string") return v;
  }
  return "";
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–",
};

/** Toglie i tag HTML, decodifica le entità, accorcia a SUMMARY_MAX_CHARS sull'ultima parola intera. */
export function toPlainSummary(html: string): string {
  const plain = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => NAMED_ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= SUMMARY_MAX_CHARS) return plain;
  const cut = plain.slice(0, SUMMARY_MAX_CHARS);
  return cut.slice(0, cut.lastIndexOf(" ") > 150 ? cut.lastIndexOf(" ") : SUMMARY_MAX_CHARS) + "…";
}

function firstImageInHtml(html: string): string | null {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

/** In Atom i link sono <link href=... rel=...>; in RSS sono testo semplice. */
function pickLink(links: unknown): string {
  const list = Array.isArray(links) ? links : links ? [links] : [];
  for (const l of list) {
    const href = attr(l, "href");
    const rel = attr(l, "rel");
    if (href && (!rel || rel === "alternate")) return href;
  }
  for (const l of list) {
    const t = text(l);
    if (t) return t;
  }
  return "";
}

function toIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function firstOf(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function parseEntry(entry: Node, platform: Platform): RawItem | null {
  const title = toPlainSummary(text(entry.title)); // decodifica anche &#8217; e simili
  const url = pickLink(entry.link);
  if (!title || !url) return null;

  const published = toIso(
    text(entry.pubDate) || text(entry.published) || text(entry.updated) || text(entry["dc:date"]),
  );
  if (!published) return null;

  const mediaGroup = (entry["media:group"] ?? {}) as Node;
  const rawBody =
    text(entry["content:encoded"]) ||
    text(entry.description) ||
    text(entry.content) ||
    text(entry.summary) ||
    text(mediaGroup["media:description"]);

  const meta: Record<string, unknown> = {};
  let image: string | null = null;

  // Miniatura: YouTube la mette dentro media:group, alcuni blog direttamente nell'item.
  const thumb = firstOf(mediaGroup["media:thumbnail"] ?? entry["media:thumbnail"]);
  image = attr(thumb, "url") || null;

  if (platform === "youtube") {
    meta.video_id = text(entry["yt:videoId"]);
  }

  if (platform === "podcast") {
    const enclosure = firstOf(entry.enclosure);
    meta.audio_url = attr(enclosure, "url") || null;
    meta.duration = text(entry["itunes:duration"]) || null;
    image = image ?? (attr(entry["itunes:image"], "href") || null);
  }

  if (platform === "github") {
    meta.release_title = title;
  }

  image = image ?? firstImageInHtml(rawBody);

  return {
    platform,
    external_id: text(entry.guid) || text(entry.id) || url,
    title,
    url,
    published_at: published,
    summary: toPlainSummary(rawBody),
    image_url: image,
    meta,
  };
}

/** Legge un feed (RSS o Atom) e restituisce i contenuti più recenti, già nel formato unico. */
export function parseFeed(xml: string, platform: Platform): RawItem[] {
  const doc = parser.parse(xml) as Node;
  const rss = doc.rss as Node | undefined;
  const atom = doc.feed as Node | undefined;

  let entries: Node[] = [];
  if (rss?.channel) entries = ((rss.channel as Node).item as Node[] | undefined) ?? [];
  else if (atom) entries = (atom.entry as Node[] | undefined) ?? [];
  else throw new Error("Formato feed non riconosciuto (né RSS né Atom)");

  return entries
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((e) => parseEntry(e, platform))
    .filter((i): i is RawItem => i !== null);
}
