/*
  Logo scritto di RAIDAR: RADAR + AI, con "AI" in un colore diverso.
  Regola (variante A): su fondo scuro "AI" è giallo segnale, su fondo chiaro o giallo è corallo.
  Le altre lettere prendono il colore del testo intorno.
*/
export default function Wordmark({
  className = "",
  accent = "text-signal",
}: {
  className?: string;
  /** classe del colore di "AI": "text-signal" su scuro, "text-coral" su chiaro */
  accent?: string;
}) {
  return (
    <span className={`font-title font-black tracking-tight ${className}`}>
      R<span className={accent}>AI</span>DAR
    </span>
  );
}
