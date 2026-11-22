/*
  Le lingue di Raidar. È un elenco di dati: per aggiungerne una basta una riga qui
  (più, se serve, il suo nome per il traduttore). Nessuna dipendenza da React o Next.js.
*/

export type Lang = "it" | "en";

export const LANGUAGES: { code: Lang; label: string; name: string }[] = [
  { code: "it", label: "Italiano", name: "italian" },
  { code: "en", label: "English", name: "english" },
];

export const DEFAULT_LANG: Lang = "it";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && LANGUAGES.some((l) => l.code === value);
}

export function langLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

/** Il segnalino sulle card tradotte. */
export const TRANSLATED_LABEL: Record<Lang, string> = { it: "Tradotto", en: "Translated" };

/** Tag "BCP 47" per date e orari (Intl). */
export const LOCALE: Record<Lang, string> = { it: "it-IT", en: "en-GB" };
