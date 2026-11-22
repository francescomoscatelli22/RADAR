import { fetchText } from "./http";
import { parseFeed } from "./feed";
import { parseHn } from "./hn";
import { detectLang } from "./lang";
import { assignTopics, buildMatchers } from "./topics";
import type { Item, Source } from "./types";

export { buildMatchers } from "./topics";
export { detectLang } from "./lang";
export type { Item, Source, Topic } from "./types";

/** Scarica una fonte e restituisce i suoi contenuti pronti da salvare. Lancia un errore se la fonte non risponde. */
export async function collectSource(
  source: Source,
  matchers: ReturnType<typeof buildMatchers>,
): Promise<Item[]> {
  const body = await fetchText(source.url);
  const raw = source.platform === "hn" ? parseHn(body) : parseFeed(body, source.platform);
  // la lingua si decide sul testo di TUTTI i contenuti della fonte (più affidabile che sul singolo titolo)
  const lang = detectLang(raw.map((r) => `${r.title}. ${r.summary}`));
  return raw
    .map((r) => assignTopics(r, source, matchers))
    .filter((i): i is Item => i !== null)
    .map((i) => ({ ...i, lang }));
}
