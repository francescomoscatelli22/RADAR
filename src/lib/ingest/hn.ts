// Hacker News tramite la ricerca Algolia (gratis, senza chiave).
// L'URL della fonte è già la ricerca completa, es.:
// https://hn.algolia.com/api/v1/search_by_date?tags=story&query=diffusion&numericFilters=points%3E30

import type { RawItem } from "./types";

interface HnHit {
  objectID: string;
  title?: string | null;
  url?: string | null;
  created_at?: string;
  points?: number | null;
  num_comments?: number | null;
  author?: string | null;
}

export function parseHn(json: string): RawItem[] {
  const data = JSON.parse(json) as { hits?: HnHit[] };
  const items: RawItem[] = [];
  for (const hit of data.hits ?? []) {
    if (!hit.title || !hit.created_at) continue;
    const discussion = `https://news.ycombinator.com/item?id=${hit.objectID}`;
    items.push({
      platform: "hn",
      external_id: hit.objectID,
      title: hit.title,
      url: hit.url || discussion, // le "Ask HN" non hanno un link esterno
      published_at: new Date(hit.created_at).toISOString(),
      summary: `${hit.points ?? 0} punti · ${hit.num_comments ?? 0} commenti`,
      image_url: null,
      meta: { points: hit.points ?? 0, comments: hit.num_comments ?? 0, discussion_url: discussion },
    });
  }
  return items;
}
