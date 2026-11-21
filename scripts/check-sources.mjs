// Controlla DAL VIVO che le fonti rispondano e siano aggiornate. Non scrive nel database.
//
//   node scripts/check-sources.mjs                         -> controlla scripts/seed/sources.json
//   node scripts/check-sources.mjs altro.json              -> controlla un altro elenco
//   node scripts/check-sources.mjs altro.json --report r.json   -> salva anche il risultato completo
//
// Per ogni fonte dice: ok / ferma (risponde ma non pubblica da troppo) / errore.
// Serve a due cose: scegliere fonti nuove senza fidarsi della memoria, e fare "pulizia fonti"
// ogni tanto (un feed può sparire o fermarsi).

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "scripts/seed/sources.json";
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;

const USER_AGENT = "RadarBot/0.1 (progetto personale, lettura feed pubblici)";
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;
// Oltre questi giorni senza novità la fonte è considerata ferma
const MAX_AGE_DAYS = { youtube: 120, article: 120, podcast: 150, github: 400, hn: 30 };

const sources = JSON.parse(readFileSync(file, "utf8"));
const now = Date.now();

function newestDate(xml) {
  const dates = [];
  const re = /<(?:pubDate|updated|published|dc:date)>\s*([^<]+?)\s*<\/(?:pubDate|updated|published|dc:date)>/gi;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    const t = Date.parse(m[1]);
    if (!Number.isNaN(t) && t <= now + 86_400_000) dates.push(t);
  }
  return dates.length ? Math.max(...dates) : null;
}

async function check(s) {
  const out = { name: s.name, platform: s.platform, url: s.url, status: "errore", detail: "", items: 0, newest: null, ageDays: null, title: "" };
  try {
    const res = await fetch(s.url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/atom+xml, application/rss+xml, application/xml, application/json, text/xml, */*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      out.detail = `HTTP ${res.status}`;
      return out;
    }
    const body = await res.text();
    let newest = null;
    if (s.platform === "hn") {
      const data = JSON.parse(body);
      out.items = Array.isArray(data.hits) ? data.hits.length : 0;
      const times = (data.hits ?? []).map((h) => Date.parse(h.created_at)).filter((t) => !Number.isNaN(t));
      newest = times.length ? Math.max(...times) : null;
      out.title = "ricerca Algolia";
    } else {
      const isFeed = /<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 5000));
      if (!isFeed) {
        out.detail = "non è un feed RSS/Atom (probabile pagina web)";
        return out;
      }
      out.items = (body.match(/<(item|entry)[\s>]/gi) ?? []).length;
      newest = newestDate(body);
      const t = /<title[^>]*>\s*(?:<!\[CDATA\[)?\s*([^<\]]+)/i.exec(body);
      out.title = t ? t[1].trim().slice(0, 60) : "";
    }
    if (out.items === 0) {
      out.detail = "feed vuoto";
      return out;
    }
    out.newest = newest ? new Date(newest).toISOString().slice(0, 10) : null;
    out.ageDays = newest ? Math.round((now - newest) / 86_400_000) : null;
    const max = MAX_AGE_DAYS[s.platform] ?? 120;
    if (out.ageDays === null) {
      out.status = "ok";
      out.detail = "data dell'ultimo contenuto non leggibile";
    } else if (out.ageDays > max) {
      out.status = "ferma";
      out.detail = `ultimo contenuto ${out.ageDays} giorni fa`;
    } else {
      out.status = "ok";
    }
    return out;
  } catch (e) {
    out.detail = e instanceof Error ? (e.name === "TimeoutError" ? "timeout" : e.message.slice(0, 80)) : String(e);
    return out;
  }
}

const results = [];
const queue = [...sources];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await check(s);
      results.push({ ...r, order: sources.indexOf(s) });
      const icon = r.status === "ok" ? "✓" : r.status === "ferma" ? "~" : "✗";
      console.log(`${icon} ${r.name.padEnd(42)} ${r.platform.padEnd(8)} ${r.status === "ok" ? `${String(r.items).padStart(3)} voci, ultima ${r.newest ?? "?"}` : r.detail}`);
    }
  }),
);

results.sort((a, b) => a.order - b.order);
const count = (st) => results.filter((r) => r.status === st).length;
console.log(`\nTotale ${results.length}: ${count("ok")} ok, ${count("ferma")} ferme, ${count("errore")} in errore.`);
if (reportPath) {
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Risultato completo salvato in ${reportPath}`);
}
