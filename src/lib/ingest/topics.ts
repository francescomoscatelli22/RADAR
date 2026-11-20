// Assegna gli argomenti a un contenuto.
// 1) quelli fissi della fonte (es. un canale taggato "ai-3d")
// 2) se la fonte è generalista (match_keywords), quelli trovati con le parole chiave.
// Le parole chiave NON sono nel codice: arrivano dalla tabella "topics".

import type { RawItem, Source, Topic, Item } from "./types";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Costruisce una volta sola le regex (parola intera, senza distinguere maiuscole). */
export function buildMatchers(topics: Topic[]): Map<string, RegExp[]> {
  const map = new Map<string, RegExp[]>();
  for (const t of topics) {
    map.set(
      t.slug,
      t.keywords.map((k) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(k)}(?![\\p{L}\\p{N}])`, "iu")),
    );
  }
  return map;
}

/** Restituisce l'item con gli argomenti, oppure null se va scartato. */
export function assignTopics(
  raw: RawItem,
  source: Source,
  matchers: Map<string, RegExp[]>,
): Item | null {
  const found = new Set<string>(source.topics);

  if (source.match_keywords) {
    const haystack = `${raw.title} ${raw.summary}`;
    for (const [slug, regexes] of matchers) {
      if (regexes.some((r) => r.test(haystack))) found.add(slug);
    }
    // Fonte generalista senza nessun argomento trovato: non è roba per Radar.
    if (found.size === 0) return null;
  }

  return { ...raw, topics: [...found] };
}
