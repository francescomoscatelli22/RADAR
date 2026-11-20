// Download "educato": si presenta con un nome chiaro, ha un timeout e segue i redirect.

const USER_AGENT = "RadarBot/0.1 (progetto personale, lettura feed pubblici)";
const TIMEOUT_MS = 20_000;

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/atom+xml, application/rss+xml, application/xml, application/json, text/xml, */*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} per ${url}`);
  }
  return res.text();
}
