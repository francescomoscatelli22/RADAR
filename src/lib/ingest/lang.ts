// Riconosce la lingua di una fonte.
// Un titolo da solo è troppo corto per essere affidabile ("Gemini 3 is here"), ma quasi ogni fonte
// scrive in una lingua sola: si guarda quindi tutto il testo raccolto dalla fonte in un colpo.

import { franc } from "franc-min";

// franc restituisce codici a tre lettere (ISO 639-3): ci servono quelli a due
const ISO_3_TO_2: Record<string, string> = {
  eng: "en", ita: "it", spa: "es", fra: "fr", deu: "de", por: "pt", nld: "nl",
  rus: "ru", cmn: "zh", jpn: "ja", kor: "ko", pol: "pl", tur: "tr", ara: "ar",
  swe: "sv", ukr: "uk", hin: "hi",
};

const MIN_CHARS = 120; // sotto questa lunghezza il riconoscimento non è affidabile

/** "en", "it"… oppure null se il testo è troppo corto o la lingua non è riconosciuta. */
export function detectLang(texts: string[]): string | null {
  const sample = texts.join(". ");
  if (sample.length < MIN_CHARS) return null;
  const code = franc(sample, { minLength: MIN_CHARS });
  return ISO_3_TO_2[code] ?? null;
}
