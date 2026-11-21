import { serverDb } from "@/lib/server/db";
import { cleanSourceName, type Platform, type SourceInfo } from "@/lib/feed";

// Le fonti attive che si possono seguire. Solo id, nome e piattaforma.
export async function GET() {
  const db = serverDb();
  if (!db) return Response.json({ error: "Database non configurato" }, { status: 503 });

  const { data, error } = await db.from("sources").select("id, name, platform").eq("active", true).order("name");
  if (error) return Response.json({ error: "Lettura non riuscita" }, { status: 502 });

  // le ricerche Hacker News sono molte ("Hacker News: ..."): all'utente ne mostriamo una sola
  const sources: SourceInfo[] = [];
  let hn: SourceInfo | null = null;
  for (const s of data ?? []) {
    if (s.platform === "hn") {
      if (hn) hn.ids.push(s.id);
      else {
        hn = { ids: [s.id], name: "Hacker News", platform: "hn" };
        sources.push(hn);
      }
      continue;
    }
    sources.push({ ids: [s.id], name: cleanSourceName(s.name), platform: s.platform as Platform });
  }
  return Response.json({ sources }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
