import { serverDb } from "@/lib/server/db";
import type { TopicNode } from "@/lib/feed";

// L'albero degli argomenti (le chip della scelta). Sta nel database, non nel codice.
export async function GET() {
  const db = serverDb();
  if (!db) return Response.json({ error: "Database non configurato" }, { status: 503 });

  const { data, error } = await db
    .from("topics")
    .select("slug, label, parent_slug, sort_order")
    .order("sort_order", { ascending: true });
  if (error) return Response.json({ error: "Lettura non riuscita" }, { status: 502 });

  const topics: TopicNode[] = (data ?? []).map((t) => ({
    slug: t.slug,
    label: t.label,
    parent: t.parent_slug,
    order: t.sort_order,
  }));
  return Response.json({ topics }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
