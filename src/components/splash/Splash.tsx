"use client";

import { useEffect, useState, type AnimationEvent, type CSSProperties } from "react";
import SignalCard from "./SignalCard";
import { CATEGORIES_A, CATEGORIES_B } from "./news";
import CodeRain from "./CodeRain";
import { ARM_ANGLE, passDelay, u } from "./geometry";
import "./splash.css";

/*
  Schermata iniziale, tradotta dal design Figma "D · Zine · Schermata iniziale (Scuro)".
  Tutto vive in un "artboard" di 390 x 844 unità (come il frame Figma) che si adatta allo schermo:
  ogni misura qui sotto è in unità del frame, e CSS la converte con la variabile --u.

  Fasi (stage):
   - intro:   radar in loop, mini-card "catturate", frasi che ruotano, invito a toccare
   - menu:    il radar si rimpicciolisce e compaiono Accedi / Registrati / Continua con Google
   - leaving: uscita verso la pagina scelta (foro circolare)
*/

export type Stage = "intro" | "menu" | "leaving";


// ---------- radar (viewBox 300, centro 150,150) ----------
const C = 150;

// Puntini: ognuno orbita attorno al centro con raggio, verso e velocità propri
// (angolo di partenza a0 in gradi, periodo in secondi, dir = 1 orario / -1 antiorario).
// Compaiono quando la lancetta li "illumina" per la prima volta, poi continuano a muoversi.
const BLIPS = [
  { r: 67, a0: -141, period: 9, dir: 1, ping: true, pingDur: 2.4 },
  { r: 58, a0: 31, period: 6.5, dir: -1, ping: true, pingDur: 2 },
  { r: 92, a0: 90, period: 12, dir: 1, ping: false, pingDur: 0 },
  { r: 114, a0: -22, period: 16, dir: -1, ping: true, pingDur: 2.8 },
].map((b) => {
  const rad = (b.a0 * Math.PI) / 180;
  const x = C + b.r * Math.cos(rad);
  const y = C + b.r * Math.sin(rad);
  return { ...b, x, y, delay: passDelay(x - C, y - C) };
});

// scia dietro la lancetta: 4 spicchi sempre più trasparenti
const TRAIL = [0.22, 0.16, 0.1, 0.05].map((opacity, k) => {
  const R = 138;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(C + R * Math.cos(rad)).toFixed(1)} ${(C + R * Math.sin(rad)).toFixed(1)}`;
  };
  const from = ARM_ANGLE - 9 * (k + 1);
  const to = ARM_ANGLE - 9 * k;
  return { opacity, d: `M${C} ${C} L${point(from)} A${R} ${R} 0 0 1 ${point(to)} Z` };
});

const stickerStyle = (cx: number, cy: number, rot: number, delay: number): CSSProperties =>
  ({ left: u(cx), top: u(cy), "--rot": `${rot}deg`, "--delay": `${delay.toFixed(2)}s` }) as CSSProperties;

// ---------- titolo ----------
const WORD = "RADAR".split("");

// ---------- frasi che ruotano ogni 3 secondi, ognuna in un punto diverso ----------
const PHRASES = [
  "meno rumore, più segnali",
  "capta ciò che conta",
  "il tuo radar sull'AI",
  "l'AI che ti interessa",
  "solo ciò che scegli tu",
  "il tuo feed sull'AI",
  "l'AI, in tempo reale",
  "sempre un passo avanti",
  "il futuro, in anteprima",
];
// Interruttore: metti true per rimostrare i blocchi con le frasi che cambiano ogni 3 secondi.
const SHOW_PHRASES = false;
const PHRASE_MS = 3000;
const PHRASE_COLORS = [
  "--color-card-article",
  "--color-accent",
  "--color-card-audio",
  "--color-card-post",
  "--color-card-thread",
  "--color-card-code",
];

type Slot = { left?: number; right?: number; top: number; rot: number; w: number };
// Posti liberi (la schermata è pulita: titolo in alto, radar, una card, invito a toccare).
// intro: sotto la card a sinistra → in alto a sinistra, sotto il titolo → sotto la card a destra
const SLOTS_INTRO: Slot[] = [
  { left: 24, top: 624, rot: -2, w: 300 },
  { left: 22, top: 130, rot: -3, w: 235 },
  { right: 22, top: 628, rot: 3, w: 300 },
];
// menu: solo sotto i pulsanti, a destra e a sinistra (tra titolo e pulsanti sta il radar)
const SLOTS_MENU: Slot[] = [
  { right: 22, top: 656, rot: 3, w: 340 },
  { left: 22, top: 656, rot: -3, w: 340 },
];

// ---------- nastri: ogni voce è diversa, niente ripetizioni dentro un giro ----------
const DOTS = ["--color-accent", "--color-card-article", "--color-platform-post", "--color-card-audio"];

function Tape({
  items,
  className,
  seconds,
}: {
  items: string[];
  className: string;
  seconds: number; // durata di un giro completo: più voci = giro più lento
}) {
  // due gruppi identici: il primo scorre via mentre il secondo entra, senza stacchi
  return (
    <div className={`splash-tape ${className}`} aria-hidden="true">
      <div className="splash-tape-track" style={{ animationDuration: `${seconds}s` }}>
        {[0, 1].map((g) => (
          <div key={g} className="splash-tape-group">
            {items.map((t, i) => (
              <span key={t}>
                {t}
                <i style={{ background: `var(${DOTS[i % DOTS.length]})` }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Logo "G" di Google (4 colori ufficiali)
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width={u(22)} height={u(22)} aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export default function Splash({
  stage,
  note,
  onStart,
  onChoose,
  onGoogle,
  onExited,
}: {
  stage: Stage;
  note: string | null; // messaggio breve sotto i pulsanti (es. Google non ancora collegato)
  onStart: () => void;
  onChoose: (href: string) => void;
  onGoogle: () => void;
  onExited: () => void;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!SHOW_PHRASES) return; // frasi spente: niente timer inutile
    const id = setInterval(() => setTick((t) => t + 1), PHRASE_MS);
    return () => clearInterval(id);
  }, []);

  // animationend risale da tutti i figli: ci interessa solo la fine dell'apertura a foro
  // (o della dissolvenza, se l'utente ha "Riduci movimento")
  const handleEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (
      stage === "leaving" &&
      (e.animationName === "sp-reveal" || e.animationName === "sp-fade-out")
    ) {
      onExited();
    }
  };

  const menu = stage !== "intro";
  const slots = menu ? SLOTS_MENU : SLOTS_INTRO;
  const slot = slots[tick % slots.length];
  const phraseStyle = {
    ...(slot.left !== undefined ? { left: u(slot.left) } : { right: u(slot.right ?? 0) }),
    top: u(slot.top),
    maxWidth: u(slot.w),
    "--rot": `${slot.rot}deg`,
    "--bg": `var(${PHRASE_COLORS[tick % PHRASE_COLORS.length]})`,
    // la prima frase entra dopo che il radar si è disegnato
    // (e dura meno, per cambiare comunque dopo 3 secondi dall'apertura)
    animationDelay: tick === 0 && !menu ? "0.9s" : "0s",
    animationDuration: tick === 0 && !menu ? "2.1s" : "3s",
  } as unknown as CSSProperties;

  return (
    <div
      className={`splash ${stage === "leaving" ? "splash-leaving" : ""}`}
      data-stage={stage}
      role="region"
      aria-label="Benvenuto in Radar"
      onAnimationEnd={handleEnd}
    >
      <div className="splash-hole" />
      <div className="splash-content">
        {/* In intro, tutto lo schermo è un unico grande pulsante "tocca per iniziare" */}
        {stage === "intro" && (
          <button
            type="button"
            className="splash-tap"
            aria-label="Tocca per iniziare"
            onClick={onStart}
          />
        )}

        {/* sfondo: codice Python che scorre piano (due strati identici e sincronizzati).
            Il primo è fioco e sempre visibile; il secondo è più luminoso e si vede solo
            dentro un anello che si allarga dal radar, come un ping: il codice "si accende" al suo passaggio. */}
        <div className="splash-dotlayer">
          <CodeRain />
        </div>
        <div className="splash-dotlayer splash-dotlayer-wave">
          <CodeRain bright />
        </div>

        <div className="splash-art">
          {/* ---------- radar: nel menu si rimpicciolisce e sale ---------- */}
          <div className="splash-cluster">
            <svg
              className="splash-radar"
              viewBox="0 0 300 300"
              aria-hidden="true"
              focusable="false"
              style={{ left: u(60), top: u(171), width: u(270), height: u(270) }}
            >
              <circle cx={C + 4} cy={C + 4} r={140} fill="var(--color-cream)" className="splash-shadow" />
              <circle cx={C} cy={C} r={138.5} fill="var(--color-surface)" />
              <circle cx={C} cy={C} r={46.5} fill="var(--color-surface-2)" />
              {/* mirini */}
              <g stroke="var(--color-cream)" strokeWidth="1.5" opacity="0.22">
                <line x1="10" y1={C} x2="290" y2={C} />
                <line x1={C} y1="10" x2={C} y2="290" />
              </g>
              {/* anelli che si disegnano, dal centro verso l'esterno */}
              <g fill="none" stroke="var(--color-cream)" strokeWidth="3">
                {[46.5, 92.5, 138.5].map((r, i) => (
                  <circle
                    key={r}
                    className="splash-ring"
                    cx={C}
                    cy={C}
                    r={r}
                    pathLength={1}
                    transform={`rotate(-90 ${C} ${C})`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </g>
              {/* lancetta + scia: ruotano insieme */}
              <g className="splash-sweep">
                {TRAIL.map((t, i) => (
                  <path key={i} d={t.d} fill="var(--color-card-article)" opacity={t.opacity} />
                ))}
                <line
                  x1={C}
                  y1={C}
                  x2="249"
                  y2="51"
                  stroke="var(--color-card-article)"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
              </g>
              {/* puntini in movimento: ogni gruppo ruota attorno al centro, il "ping" si muove con lui */}
              {BLIPS.map((b, i) => (
                <g
                  key={i}
                  className="splash-orbit"
                  style={{
                    animationDuration: `${b.period}s`,
                    animationDirection: b.dir < 0 ? "reverse" : "normal",
                  }}
                >
                  {b.ping && (
                    <circle
                      className="splash-ping"
                      cx={b.x}
                      cy={b.y}
                      r={19}
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="2.5"
                      style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.pingDur}s` }}
                    />
                  )}
                  <circle
                    className="splash-blip"
                    cx={b.x}
                    cy={b.y}
                    r={8}
                    fill="var(--color-accent)"
                    stroke="var(--color-cream)"
                    strokeWidth="2.5"
                    style={{ animationDelay: `${b.delay}s` }}
                  />
                </g>
              ))}
              {/* il puntino al centro resta fermo, ma pulsa */}
              <circle
                className="splash-core"
                cx={C}
                cy={C}
                r={9}
                fill="var(--color-accent)"
                stroke="var(--color-cream)"
                strokeWidth="2.5"
              />
            </svg>

          </div>

          {/* ---------- una sola card in evidenza, che cambia ogni 2 secondi ---------- */}
          <SignalCard />

          <span className="splash-live" style={stickerStyle(344, 66, -5, 0.5)}>
            <i /> LIVE
          </span>

          {/* ---------- titolo ---------- */}
          <div className="splash-title" aria-hidden="true">
            {WORD.map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.8 + i * 0.07}s` }}>
                {ch}
              </span>
            ))}
          </div>

          {/* ---------- frase che ruota (spenta per ora: vedi SHOW_PHRASES) ---------- */}
          {SHOW_PHRASES && (
            <p
              key={`${menu ? "m" : "i"}-${tick}`}
              className="splash-phrase"
              style={phraseStyle}
              aria-hidden="true"
            >
              {PHRASES[tick % PHRASES.length]}
            </p>
          )}

          {/* ---------- invito a toccare (solo intro) ---------- */}
          <div className="splash-hint" aria-hidden="true">
            <i />
            Tocca per iniziare
          </div>

          {/* ---------- pulsanti (solo menu) ---------- */}
          <div className="splash-actions">
            <button
              type="button"
              className="splash-btn splash-btn-primary"
              style={{ "--d": "0.1s", top: u(380) } as CSSProperties}
              tabIndex={menu ? 0 : -1}
              onClick={() => onChoose("/accedi")}
            >
              Accedi
            </button>
            <button
              type="button"
              className="splash-btn splash-btn-secondary"
              style={{ "--d": "0.2s", top: u(458) } as CSSProperties}
              tabIndex={menu ? 0 : -1}
              onClick={() => onChoose("/registrati")}
            >
              Registrati
            </button>
            <span className="splash-sticker splash-sticker-first" style={{ left: u(306), top: u(462), "--rot": "-6deg" } as CSSProperties}>
              PRIMA VOLTA?
            </span>
            <button
              type="button"
              className="splash-btn splash-btn-google"
              style={{ "--d": "0.3s", top: u(536) } as CSSProperties}
              tabIndex={menu ? 0 : -1}
              onClick={onGoogle}
            >
              <GoogleLogo />
              Continua con Google
            </button>
            <p className="splash-note" role="status" style={{ top: u(604) }}>
              {note}
            </p>
          </div>

          {/* ---------- nastri incrociati ---------- */}
          <Tape items={CATEGORIES_B} className="splash-tape-b" seconds={55} />
          <Tape items={CATEGORIES_A} className="splash-tape-a" seconds={60} />
        </div>
      </div>
    </div>
  );
}
