// Tipi condivisi della raccolta. Nessuna dipendenza da React o Next.js:
// questa cartella gira sia nello script (GitHub Actions) sia, in futuro, altrove.

export type Platform = "youtube" | "article" | "podcast" | "github" | "hn";

export interface Topic {
  slug: string;
  label: string;
  parent_slug: string | null;
  keywords: string[];
  sort_order: number;
}

export interface Source {
  id: string;
  platform: Platform;
  name: string;
  url: string;
  topics: string[];
  match_keywords: boolean;
  active: boolean;
}

/** Un contenuto in formato unico, qualunque sia la piattaforma di origine. */
export interface RawItem {
  platform: Platform;
  external_id: string;
  title: string;
  url: string;
  published_at: string; // ISO 8601
  summary: string;
  image_url: string | null;
  meta: Record<string, unknown>;
}

export interface Item extends RawItem {
  topics: string[];
  /** Lingua del testo ("it", "en"…), oppure null se non riconosciuta (allora non si traduce). */
  lang: string | null;
}
