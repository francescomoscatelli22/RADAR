"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import DevPause from "./DevPause";
import Radar, { type RadarData } from "./Radar";
import Wordmark from "@/components/ui/Wordmark";
import { buildLaps, interleave } from "./radar-model";
import type { Signal, SignalsResponse } from "@/lib/signals";
import { LANGUAGES, langLabel } from "@/lib/languages";
import { radar, useLang } from "@/lib/store";
import {
  ART_H,
  ART_W,
  BAR_SECONDS,
  MONO,
  PEEL_AT,
  REVEAL_AT,
  STRIPES,
  STRIPE_SECONDS,
  STRIPE_STAGGER,
  TOTAL_SECONDS,
  clamp01,
  easeInOut,
  easeOut,
  DISPLAY,
  type Time,
} from "./timeline";

/*
  Intro animata di Radar: un RADAR su fondo scuro da 8,5 secondi (la barra di caricamento), poi tre strisce
  colorate lo "strappano" via e scoprono la schermata iniziale (Splash).

  Cosa si vede (il tempo è quello dell'orologio unico `time`; il disegno vive in Radar.tsx, i numeri in radar-model.ts):
    0 – 1,2 s    gli anelli del radar (gigante, tagliato ai bordi) si disegnano, poi il numero al centro
    1 – 8,5 s    la lancetta gira 3 volte; a ogni puntino catturato il contatore sale e a volte compare un contenuto vero
    8,5 s        barra al 100%: la lancetta si ferma, l'orologio aspetta e compaiono "Tocca per continuare" e "Imposta lingua"
    dopo il tocco  strappo a strisce (circa 1 s) → schermata iniziale

  Contatore ed etichette mostrano dati VERI (da /api/signals): le tre finestre (30 min, 3 ore, 24 ore) sono i tre giri.
  Se il database non risponde il contatore dice "—" e non ci sono etichette. Solo la barra è grafica: è a tempo fisso.
*/

const INK = "var(--color-card-ink)";
const BG = "var(--color-bg)";
const YELLOW = "var(--color-card-article)";
const CREAM = "var(--color-cream)";
const ACCENT = "var(--color-accent)";
const GREEN = "var(--color-card-audio)";

type Geometry = RefObject<{ w: number; h: number }>;

// ---------- il nome dell'app, in alto al centro (sotto la Dynamic Island) ----------
function Title({ time, reduce }: { time: Time; reduce: boolean }) {
  const opacity = useTransform(time, (t) => (reduce ? 1 : easeOut(clamp01(t / 0.6))));
  const y = useTransform(time, (t) => (reduce ? 0 : -12 * (1 - easeOut(clamp01(t / 0.6)))));
  return (
    <motion.div
      style={{ position: "absolute", left: 0, top: 58, width: ART_W, textAlign: "center", color: CREAM, fontSize: 32, lineHeight: 1, opacity, y }}
    >
      <Wordmark />
    </motion.div>
  );
}

// ---------- barra di caricamento: 8,5 secondi esatti ----------
const STATUS = [
  { from: 0, text: "CAPTO SEGNALI…" },
  { from: 0.25, text: "LEGGO LE FONTI…" },
  { from: 0.5, text: "ORDINO IL FEED…" },
  { from: 0.78, text: "QUASI FATTO…" },
  { from: 1, text: "PRONTO" },
];

function Bar({ time, live }: { time: Time; live: Time }) {
  const progress = (t: number) => clamp01(t / BAR_SECONDS);
  const percent = useTransform(time, (t) => `${Math.round(progress(t) * 100)}%`);
  const status = useTransform(time, (t) => {
    const p = progress(t);
    return [...STATUS].reverse().find((s) => p >= s.from)?.text ?? STATUS[0].text;
  });
  const enter = useTransform(time, (t) => 30 * (1 - easeOut(clamp01(t / 0.5))));
  const opacity = useTransform(time, (t) => clamp01(t / 0.3));

  return (
    <motion.div style={{ position: "absolute", left: 24, top: 750, width: 342, y: enter, opacity }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 11,
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: CREAM,
        }}
      >
        <motion.span>{status}</motion.span>
        <motion.span style={{ fontSize: 15, letterSpacing: 0 }}>{percent}</motion.span>
      </div>
      <div
        style={{
          height: 28,
          boxSizing: "border-box",
          overflow: "hidden",
          border: `3px solid ${CREAM}`,
          background: "rgba(255,253,245,0.06)",
          boxShadow: `4px 4px 0 ${ACCENT}`,
        }}
      >
        <Pixels time={time} live={live} />
      </div>
    </motion.div>
  );
}

// ---------- la barra a pixel ----------
// Una fila di blocchetti quadrati (stile 8-bit) che si accendono uno dopo l'altro. Il blocchetto di testa lampeggia
// e un pixel corallo corre sopra quelli accesi; a barra piena continua a correre avanti e indietro (orologio libero).
const CELLS = 28;

function PixelCell({ time, live, i }: { time: Time; live: Time; i: number }) {
  const backgroundColor = useTransform([time, live], ([t, l]: number[]) => {
    const filled = (clamp01(t / BAR_SECONDS) * CELLS) > i;
    if (!filled) return "rgba(255,253,245,0.1)";
    // pixel corallo che corre su e giù per la fila (ping-pong)
    const span = CELLS + 6;
    const x = ((l * 16) % (span * 2));
    const pos = (x < span ? x : span * 2 - x) - 3;
    return Math.abs(pos - i) < 1.2 ? "var(--color-accent)" : "var(--color-card-article)";
  });
  const opacity = useTransform([time, live], ([t, l]: number[]) => {
    const f = clamp01(t / BAR_SECONDS) * CELLS;
    // il blocchetto di testa (quello che si sta riempiendo) lampeggia finché non è acceso del tutto
    return f > i && f < i + 1 && t < BAR_SECONDS ? (Math.floor(l * 9) % 2 === 0 ? 1 : 0.35) : 1;
  });
  return <motion.i style={{ display: "block", flex: 1, height: "100%", backgroundColor, opacity }} />;
}

function Pixels({ time, live }: { time: Time; live: Time }) {
  return (
    <div style={{ display: "flex", gap: 2, height: "100%", padding: 3, boxSizing: "border-box" }}>
      {Array.from({ length: CELLS }, (_, i) => (
        <PixelCell key={i} time={time} live={live} i={i} />
      ))}
    </div>
  );
}

// ---------- fine del caricamento: "Tocca per continuare" (nell'artboard, solo grafica) ----------
function ContinueHint() {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ position: "absolute", left: 24, top: 622, width: 342, display: "flex", justifyContent: "center" }}
    >
      <motion.span
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 16px",
          background: INK,
          border: `2px solid ${GREEN}`,
          color: YELLOW,
          boxShadow: `4px 4px 0 ${GREEN}`,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <i style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
        Tocca per continuare
      </motion.span>
    </motion.div>
  );
}

// ---------- pulsante lingua: mostra la lingua attuale, un tocco passa alla successiva ----------
function LanguageButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: 24,
        top: 674,
        width: 342,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        style={{
          pointerEvents: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 18px",
          boxSizing: "border-box",
          border: `3px solid ${INK}`,
          background: CREAM,
          boxShadow: `3px 3px 0 ${ACCENT}`,
          color: INK,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <ellipse cx="12" cy="12" rx="4" ry="9.5" />
          <path d="M2.5 12h19" />
        </svg>
        {label}
      </button>
    </motion.div>
  );
}

// ---------- strappo: tre strisce colorate attraversano lo schermo ----------
const STRIPE_COLORS = [BG, CREAM, ACCENT]; // dal fondo alla cima: l'ultima a restare è quella scura, come lo sfondo dello Splash

// zona dello schermo senza le fasce di sistema dell'iPhone (in alto iOS 26 sfoca): qui sta tutto il disegno dell'intro
const SAFE_ZONE: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "var(--safe-top-clear)",
  bottom: "var(--safe-bottom)",
};

function Stripe({ time, i, geometry }: { time: Time; i: number; geometry: Geometry }) {
  const x = useTransform(time, (t) => {
    const travel = geometry.current.w + 400;
    const enter = easeInOut(clamp01((t - (BAR_SECONDS + i * STRIPE_STAGGER)) / STRIPE_SECONDS));
    const leave = easeInOut(clamp01((t - (PEEL_AT + (STRIPES - 1 - i) * STRIPE_STAGGER)) / STRIPE_SECONDS));
    return -travel * (1 - enter) + travel * leave;
  });
  return (
    <motion.div
      style={{
        position: "absolute",
        top: -80,
        bottom: -80,
        left: -200,
        right: -200,
        background: STRIPE_COLORS[i],
        skewX: -8,
        x,
        zIndex: 10 + i,
      }}
    />
  );
}

// "Riduci movimento": sul server vale false, sul telefono il valore vero (senza avvisi di idratazione)
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

// ---------- schermata completa ----------
export default function Intro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const reduce = usePrefersReducedMotion();
  const time = useMotionValue(0);
  const live = useMotionValue(0); // orologio libero: non si ferma mai (a differenza di time), guida i movimenti che continuano dopo il caricamento
  const sweep = useMotionValue(0); // orologio della lancetta del radar: come `time` fino a fine caricamento, poi continua da solo
  // numeri veri per il radar: stanno in un riferimento (così i calcoli leggono sempre l'ultimo valore)
  // e `version` avvisa il radar quando cambiano, anche se l'orologio è fermo
  const radarData = useRef<RadarData>({ state: "loading", laps: [], pool: [] });
  const version = useMotionValue(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const safeRef = useRef<HTMLDivElement>(null); // area senza le fasce di sistema dell'iPhone
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const geometry = useRef({ w: ART_W, h: ART_H });
  const [scale, setScale] = useState(0); // 0 = non ancora misurato (resta nascosto)
  const [ready, setReady] = useState(false); // barra al 100%: l'intro aspetta un tocco
  const [go, setGo] = useState(false); // toccato: partono le strisce
  const lang = useLang();
  const releasedRef = useRef(false);
  const readyRef = useRef(false);

  // l'artboard 390 x 844 si adatta allo schermo, come la schermata iniziale
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      geometry.current = { w, h };
      // la grandezza dell'artboard si calcola sulla zona sicura, non su tutto lo schermo
      const box = safeRef.current ?? el;
      setScale(Math.min(box.clientWidth / ART_W, box.clientHeight / ART_H));
    });
    observer.observe(el);
    if (safeRef.current) observer.observe(safeRef.current);
    return () => observer.disconnect();
  }, []);

  // legge dal database quanti segnali ci sono davvero
  useEffect(() => {
    const request = new AbortController();
    fetch("/api/signals", { signal: request.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("risposta non valida"))))
      .then((data: Partial<SignalsResponse>) => {
        if (!Array.isArray(data.windows) || data.windows.length === 0) throw new Error("finestre mancanti");
        const items: Signal[] = Array.isArray(data.items) ? data.items : [];
        radarData.current = { state: "ok", laps: buildLaps(data.windows), pool: interleave(items) };
        version.set(version.get() + 1);
      })
      .catch(() => {
        if (request.signal.aborted) return;
        radarData.current = { state: "error", laps: [], pool: [] };
        version.set(version.get() + 1);
      });
    return () => request.abort();
  }, [version]);

  // orologio libero: avanza sempre, anche quando time aspetta il tocco. Con "Riduci movimento" resta fermo.
  // Da qui si ricava anche l'orologio della lancetta (`sweep`): uguale a `time` finché dura il caricamento,
  // poi continua da solo alla stessa velocità, così la lancetta del radar non si ferma mai.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    let endedAt: number | null = null; // secondo (di `live`) in cui la barra è arrivata al 100%
    const tick = (now: number) => {
      const l = (now - start) / 1000;
      live.set(l);
      const t = time.get();
      if (t < BAR_SECONDS) {
        endedAt = null;
        sweep.set(t);
      } else {
        if (endedAt === null) endedAt = l;
        sweep.set(BAR_SECONDS + (l - endedAt));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, time, sweep, reduce]);

  const handleReveal = useEffectEvent(onReveal);
  const handleDone = useEffectEvent(onDone);

  // l'orologio: da 0 a BAR_SECONDS, in linea retta; poi aspetta il tocco
  useEffect(() => {
    // /?intro-t=3.2 → ferma l'orologio al secondo 3,2 (serve a controllare un fotogramma)
    const frozen = new URLSearchParams(window.location.search).get("intro-t");
    if (frozen !== null) {
      time.set(Number(frozen));
      setReady(Number(frozen) >= BAR_SECONDS);
      return;
    }
    time.set(0);
    releasedRef.current = false;
    readyRef.current = false;
    let revealed = false;
    // con le strisce lo Splash si monta quando tutto è coperto; con "Riduci movimento" subito dopo il tocco, sotto la dissolvenza
    const revealAt = reduce ? BAR_SECONDS + 0.05 : REVEAL_AT;
    const controls = animate(time, TOTAL_SECONDS, {
      duration: TOTAL_SECONDS,
      ease: "linear",
      onComplete: () => handleDone(),
    });
    const stop = time.on("change", (t) => {
      // barra al 100%: l'orologio si ferma finché non arriva il tocco
      if (!releasedRef.current && t >= BAR_SECONDS) {
        controls.pause();
        controls.time = BAR_SECONDS;
        time.set(BAR_SECONDS);
        if (!readyRef.current) {
          readyRef.current = true;
          setReady(true);
        }
        return;
      }
      if (!revealed && t >= revealAt) {
        revealed = true;
        handleReveal();
      }
    });
    controlsRef.current = controls; // serve alla barra di pausa in sviluppo e al tocco per continuare
    return () => {
      stop();
      controls.stop();
      controlsRef.current = null;
    };
  }, [time, reduce]);

  // tocco dopo il caricamento: l'orologio riparte e le strisce strappano la schermata
  const proceed = () => {
    if (!readyRef.current || releasedRef.current) return;
    releasedRef.current = true;
    setGo(true);
    controlsRef.current?.play();
  };

  // lingua: ogni tocco passa alla successiva dell'elenco (la scelta si salva da sola, anche nell'account)
  const pressLanguage = () => {
    const at = LANGUAGES.findIndex((l) => l.code === lang);
    radar.setLang(LANGUAGES[(at + 1) % LANGUAGES.length].code);
  };

  // la schermata sparisce quando le strisce la coprono del tutto (o si dissolve, con "Riduci movimento")
  const posterOpacity = useTransform(time, (t) =>
    reduce ? 1 - clamp01((t - BAR_SECONDS) / 0.4) : t < REVEAL_AT ? 1 : 0,
  );

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Caricamento di Raidar"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        // "lvh" e non "dvh": aprendo l'app dalla Home, iOS per un attimo misura lo schermo più corto
        // e sotto restava una striscia di colore diverso; lvh è sempre l'altezza piena
        height: "100lvh",
        overflow: "hidden",
        fontFamily: DISPLAY,
      }}
    >
      <motion.div style={{ position: "absolute", inset: 0, background: BG, opacity: posterOpacity }}>
        {/* zona sicura: niente contenuto sotto l'ora/batteria e la barra in basso.
            Su iOS 26 quella fascia in alto viene sfocata dal sistema. */}
        <div
          ref={safeRef}
          style={SAFE_ZONE}
        >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: ART_W,
            height: ART_H,
            marginLeft: -ART_W / 2,
            marginTop: -ART_H / 2,
            transform: `scale(${scale})`,
            visibility: scale > 0 ? "visible" : "hidden",
          }}
        >
          <Radar time={time} live={live} sweep={sweep} data={radarData} version={version} reduce={reduce} />
          <Title time={time} reduce={reduce} />
          <Bar time={time} live={live} />
          {ready && !go && <ContinueHint />}
        </div>
        </div>

        {/* a barra finita tutto lo schermo è un pulsante "Tocca per continuare"; "Imposta lingua" sta sopra, nel suo strato */}
        {ready && !go && (
          <>
            <button
              type="button"
              aria-label="Tocca per continuare"
              onClick={proceed}
              style={{ position: "absolute", inset: 0, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
            />
            {/* stessa zona sicura dell'artboard: altrimenti il pulsante finisce più in basso e si sovrappone */}
            <div style={{ ...SAFE_ZONE, pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: ART_W,
                  height: ART_H,
                  marginLeft: -ART_W / 2,
                  marginTop: -ART_H / 2,
                  transform: `scale(${scale})`,
                  pointerEvents: "none",
                }}
              >
                <LanguageButton label={langLabel(lang)} onPress={pressLanguage} />
              </div>
            </div>
          </>
        )}
      </motion.div>

      {!reduce && STRIPE_COLORS.map((_, i) => <Stripe key={i} time={time} i={i} geometry={geometry} />)}

      {/* solo in sviluppo: pausa e scorrimento del tempo; nella versione di produzione non viene nemmeno inclusa */}
      {process.env.NODE_ENV !== "production" && <DevPause time={time} controlsRef={controlsRef} />}
    </div>
  );
}
