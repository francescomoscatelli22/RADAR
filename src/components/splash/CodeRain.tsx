import { CODE_COLUMNS } from "./code";
import "./splash.css";

/*
  Sfondo di codice: colonne che scorrono in verticale. Ogni colonna contiene il testo due volte,
  così quando la prima copia è uscita la seconda è già al suo posto e il giro riparte senza stacchi.
  Le misure usano --u (1 unità = 1/390 della larghezza dello schermo), definita da chi lo usa.
  bright = versione luminosa, da mascherare con l'onda del ping.
*/
export default function CodeRain({ bright = false }: { bright?: boolean }) {
  return (
    <div className={`splash-code ${bright ? "splash-code-bright" : ""}`} aria-hidden="true">
      {CODE_COLUMNS.map((col, c) => (
        <div key={c} className={`splash-code-col ${col.outer ? "splash-code-outer" : ""}`}>
          <div
            className="splash-code-track"
            style={{
              animationDuration: `${col.seconds}s`,
              animationDirection: col.reverse ? "reverse" : "normal",
            }}
          >
            {[0, 1].map((g) => (
              <div key={g}>
                {col.lines.map((l, i) => (
                  <span key={i} className={l.k ? `cc-${l.k}` : undefined}>
                    {l.t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
