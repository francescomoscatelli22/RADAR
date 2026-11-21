"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import DevPause from "./DevPause";
import { windowLabel, type Signal, type SignalsResponse } from "@/lib/signals";
import { useOpeningCategories } from "../splash/news";
import CodeRain from "../splash/CodeRain";
import Tiles from "./tiles";
import {
  ACCENT_SERIF,
  ART_H,
  ART_W,
  BAR_SECONDS,
  DISPLAY,
  MARKER,
  MONO,
  PEEL_AT,
  REVEAL_AT,
  STRIPES,
  STRIPE_SECONDS,
  STRIPE_STAGGER,
  TOTAL_SECONDS,
  backOut,
  clamp01,
  easeInOut,
  easeOut,
  type Time,
} from "./timeline";

/*
  Intro animata di Radar: un POSTER GIALLO da 8,5 secondi (la barra di caricamento), poi tre strisce
  colorate lo "strappano" via e scoprono la schermata iniziale (Splash, scura, con il radar).
  Apposta è l'opposto dello Splash: fondo giallo pieno, niente radar, scritte giganti.

  Cosa si vede (il tempo è quello dell'orologio unico `time`):
    0,5 – 2,8 s  le parole "L'AI / CHE / CONTA." salgono una alla volta (lente, una ogni 0,6 s)
    2,3 – 3,6 s  arrivano il contatore, la frase d'accento e il nastro
    2,8 – 4,6 s  i 4 formati del feed (due file) arrivano dai lati come adesivi, uno ogni 0,6 s, ognuno con la sua micro-animazione
    7,4 s        adesivo "SI PARTE!"
    8,5 s        barra al 100%: l'orologio si ferma e compaiono "Tocca per continuare" e "Imposta lingua"
    dopo il tocco  strappo a strisce (circa 1 s) → schermata iniziale

  Contatore e blocchi mostrano dati VERI (quanti contenuti ha raccolto Radar e gli ultimi per formato,
  da /api/signals): se il database non risponde, il contatore dice "—" e i blocchi non compaiono.
  Solo la barra è grafica: è a tempo fisso.
*/

const INK = "var(--color-card-ink)";
const YELLOW = "var(--color-card-article)";
const CREAM = "var(--color-cream)";
const ACCENT = "var(--color-accent)";
const GREEN = "var(--color-card-audio)";

type Geometry = RefObject<{ w: number; h: number }>;

// ---------- le tre parole giganti ----------
function Word({ time, at, instant, children }: { time: Time; at: number; instant: boolean; children: ReactNode }) {
  const p = (t: number) => (instant ? 1 : easeOut(clamp01((t - at) / 1.1)));
  const y = useTransform(time, (t) => `${(1 - p(t)) * 118}%`);
  const rotate = useTransform(time, (t) => (1 - p(t)) * 7);
  return (
    <div style={{ overflow: "hidden", padding: "2px 0" }}>
      <motion.div style={{ y, rotate, transformOrigin: "0 100%" }}>{children}</motion.div>
    </div>
  );
}

function Headline({ time, live, instant }: { time: Time; live: Time; instant: boolean }) {
  // `live` e' l'orologio che non si ferma mai: il blocco nero "CONTA." continua a dondolare a caricamento finito
  const blockRotate = useTransform(live, (t) => -1.5 + (instant ? 0 : Math.sin(t * 2.4) * 1.1));
  const blockScale = useTransform(live, (t) => (instant ? 1 : 1 + Math.sin(t * 1.6 + 1) * 0.015));
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 76,
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 88,
        lineHeight: 0.9,
        letterSpacing: "-0.055em",
        color: INK,
      }}
    >
      <Word time={time} at={0.5} instant={instant}>
        L&apos;AI
      </Word>
      <Word time={time} at={1.1} instant={instant}>
        CHE
      </Word>
      <Word time={time} at={1.7} instant={instant}>
        <motion.span
          style={{ display: "inline-block", padding: "0 12px 6px", background: INK, color: YELLOW, rotate: blockRotate, scale: blockScale }}
        >
          CONTA.
        </motion.span>
      </Word>
    </div>
  );
}

// frase d'accento accanto a "CHE"
function Phrase({ time, live, instant }: { time: Time; live: Time; instant: boolean }) {
  const p = (t: number) => (instant ? 1 : easeOut(clamp01((t - 2.9) / 0.8)));
  const opacity = useTransform(time, (t) => p(t));
  const y = useTransform([time, live], ([t, l]: number[]) => 14 * (1 - p(t)) + (instant ? 0 : Math.sin(l * 1.3) * 2.5));
  return (
    <motion.p
      style={{
        position: "absolute",
        left: 218,
        top: 190,
        width: 150,
        margin: 0,
        fontFamily: ACCENT_SERIF,
        fontStyle: "italic",
        fontSize: 23,
        lineHeight: 1.02,
        color: INK,
        opacity,
        y,
      }}
    >
      il tuo radar sull&apos;AI.
    </motion.p>
  );
}

// ---------- contatore "segnali rilevati": adesivo nero accanto a "L'AI" ----------
// Il numero è VERO: quanti segnali sono arrivati in Radar nella finestra di tempo scritta sotto
// ("negli ultimi 15 minuti"…), letti dal database tramite /api/signals.
// Sale da 0 al numero durante il caricamento. Se il database non risponde, mostra "—" invece di inventare.
type SignalsState = "loading" | "ok" | "error";

function Counter({
  time,
  live,
  total,
  state,
  windowText,
}: {
  time: Time;
  live: Time;
  total: Time;
  state: SignalsState;
  windowText: string;
}) {
  const n = useTransform([time, total], ([t, tot]: number[]) => {
    const p = clamp01((t - 2.4) / 5.0);
    return String(Math.round(tot * (1 - (1 - p) * (1 - p))));
  });
  const scale = useTransform(time, (t) => backOut(clamp01((t - 2.3) / 0.7)));
  // se i segnali superano 9999 il numero si rimpicciolisce per restare dentro l'adesivo
  const wobble = useTransform(live, (l) => 4 + Math.sin(l * 1.9) * 1.8);
  const bob = useTransform(live, (l) => Math.sin(l * 1.4 + 2) * 3);
  const numberSize = useTransform(total, (v) => (v >= 10000 ? 34 : 44));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: 236,
        top: 84,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 12px 9px",
        background: INK,
        boxShadow: `4px 4px 0 ${ACCENT}`,
        color: CREAM,
        rotate: wobble,
        y: bob,
        scale,
        opacity: scale,
      }}
    >
      <motion.b
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: numberSize,
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          color: YELLOW,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {state === "error" ? "—" : n}
      </motion.b>
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 8.5, lineHeight: 1.1, letterSpacing: "0.12em" }}>
        SEGNALI RILEVATI
      </span>
      {state === "ok" && windowText && (
        <span
          style={{
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 7.5,
            lineHeight: 1.1,
            letterSpacing: "0.06em",
            color: YELLOW,
            textTransform: "uppercase",
          }}
        >
          {windowText}
        </span>
      )}
    </motion.div>
  );
}

// ---------- nastro nero con i temi che scorre ----------
function Tape({ time, live }: { time: Time; live: Time }) {
  const group = useRef<HTMLDivElement>(null);
  // i settori AI (tutti, dallo stesso elenco della raccolta) in un ordine diverso a ogni apertura;
  // se ne mostrano 30, più che sufficienti per tutta la durata dell'intro
  const all = useOpeningCategories();
  const topics = useMemo(() => [...all].reverse().slice(0, 30), [all]);
  const enter = useTransform(time, (t) => -520 * (1 - easeOut(clamp01((t - 2.6) / 1.0))));
  const scroll = useTransform(live, (t) => -((t * 55) % (group.current?.offsetWidth || 900)));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: -20,
        top: 338,
        width: 430,
        height: 28,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: INK,
        color: YELLOW,
        rotate: -2.5,
        x: enter,
      }}
    >
      <motion.div style={{ display: "flex", width: "max-content", x: scroll }}>
        {[0, 1].map((g) => (
          <div key={g} ref={g === 0 ? group : undefined} style={{ display: "flex", flex: "none" }}>
            {topics.map((topic, i) => (
              <span
                key={topic}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingRight: 10,
                  whiteSpace: "nowrap",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {topic}
                <i
                  style={{
                    display: "block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: i % 2 ? ACCENT : CREAM,
                  }}
                />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---------- adesivo "SI PARTE!" sul blocco CONTA. ----------
function GoSticker({ time, live }: { time: Time; live: Time }) {
  const p = (t: number) => backOut(clamp01((t - (BAR_SECONDS - 1.1)) / 0.45));
  const scale = useTransform(time, (t) => p(t));
  const rotate = useTransform([time, live], ([t, l]: number[]) => -8 + 24 * (1 - p(t)) + Math.sin(l * 3) * 3);
  const pop = useTransform([time, live], ([t, l]: number[]) => p(t) * (1 + Math.sin(l * 3 + 1) * 0.06));
  return (
    <motion.span
      style={{
        position: "absolute",
        left: 318,
        top: 246,
        padding: "3px 12px",
        border: `3px solid ${INK}`,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `3px 3px 0 ${INK}`,
        color: INK,
        fontFamily: MARKER,
        fontSize: 19,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        x: "-50%",
        y: "-50%",
        scale: pop,
        opacity: scale,
        rotate,
      }}
    >
      SI PARTE!
    </motion.span>
  );
}

// ---------- barra di caricamento: 5 secondi esatti ----------
const STATUS = [
  { from: 0, text: "CAPTO SEGNALI…" },
  { from: 0.25, text: "LEGGO LE FONTI…" },
  { from: 0.5, text: "ORDINO IL FEED…" },
  { from: 0.78, text: "QUASI FATTO…" },
  { from: 1, text: "PRONTO" },
];

function Bar({ time, live }: { time: Time; live: Time }) {
  const progress = (t: number) => clamp01(t / BAR_SECONDS);
  const width = useTransform(time, (t) => `${progress(t) * 100}%`);
  const stripes = useTransform(live, (t) => `${t * 40}px 0`); // le strisce scorrono anche a barra piena
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
          color: INK,
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
          border: `3px solid ${INK}`,
          background: CREAM,
          boxShadow: `4px 4px 0 ${INK}`,
        }}
      >
        <motion.div
          style={{
            height: "100%",
            boxSizing: "border-box",
            backgroundColor: INK,
            backgroundImage: "repeating-linear-gradient(-45deg, #2b2b2b 0 8px, transparent 8px 16px)",
            backgroundPosition: stripes,
            width,
          }}
        />
      </div>
    </motion.div>
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
          color: YELLOW,
          boxShadow: `4px 4px 0 ${GREEN}`,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <i style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
        Tocca per continuare
      </motion.span>
    </motion.div>
  );
}

// ---------- pulsante "Imposta lingua" (per ora senza funzione: dice che le lingue arrivano dopo) ----------
function LanguageButton({ note, onPress }: { note: boolean; onPress: () => void }) {
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
          boxShadow: `3px 3px 0 ${INK}`,
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
        Imposta lingua
      </button>
      {note && (
        <span role="status" style={{ fontFamily: MONO, fontWeight: 600, fontSize: 9, letterSpacing: "0.06em", color: INK }}>
          IN ARRIVO · PER ORA SOLO ITALIANO
        </span>
      )}
    </motion.div>
  );
}

// ---------- strappo: tre strisce colorate attraversano lo schermo ----------
const STRIPE_COLORS = [INK, CREAM, ACCENT]; // dal fondo alla cima: l'ultima a restare è quella nera, come lo sfondo dello Splash

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
  const total = useMotionValue(0); // numero vero di segnali raccolti (0 finché la risposta non arriva)
  const [signals, setSignals] = useState<SignalsState>("loading");
  const [windowText, setWindowText] = useState(""); // es. "negli ultimi 15 minuti"
  const [items, setItems] = useState<Signal[]>([]); // gli ultimi contenuti veri, uno per formato (vuoto se il database non risponde)
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const geometry = useRef({ w: ART_W, h: ART_H });
  const [scale, setScale] = useState(0); // 0 = non ancora misurato (resta nascosto)
  const [ready, setReady] = useState(false); // barra al 100%: l'intro aspetta un tocco
  const [go, setGo] = useState(false); // toccato: partono le strisce
  const [langNote, setLangNote] = useState(false);
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
      setScale(Math.min(w / ART_W, h / ART_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // legge dal database quanti segnali ci sono davvero
  useEffect(() => {
    const request = new AbortController();
    fetch("/api/signals", { signal: request.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("risposta non valida"))))
      .then((data: Partial<SignalsResponse>) => {
        if (typeof data.count !== "number") throw new Error("numero mancante");
        // il contatore mostra i segnali arrivati nella finestra più stretta che ne ha almeno uno;
        // se negli ultimi 7 giorni non ne è arrivato nessuno, dice 0 (vero) su quei 7 giorni
        total.set(data.recent?.count ?? 0);
        setWindowText(windowLabel(data.recent?.seconds ?? 604800));
        setItems(Array.isArray(data.items) ? data.items : []);
        setSignals("ok");
      })
      .catch(() => {
        if (!request.signal.aborted) setSignals("error");
      });
    return () => request.abort();
  }, [total]);

  // orologio libero: avanza sempre, anche quando time aspetta il tocco. Con "Riduci movimento" resta fermo.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      live.set((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, reduce]);

  const handleReveal = useEffectEvent(onReveal);
  const handleDone = useEffectEvent(onDone);

  // l'orologio: da 0 a 6 secondi, in linea retta
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

  // tocco dopo il caricamento: l'orologio riparte e le strisce strappano il poster
  const proceed = () => {
    if (!readyRef.current || releasedRef.current) return;
    releasedRef.current = true;
    setGo(true);
    controlsRef.current?.play();
  };

  // "Imposta lingua": per ora solo un avviso (le lingue arrivano dopo)
  const pressLanguage = () => {
    setLangNote(true);
    window.setTimeout(() => setLangNote(false), 2600);
  };

  // il poster sparisce quando le strisce lo coprono del tutto (o si dissolve, con "Riduci movimento")
  const posterOpacity = useTransform(time, (t) =>
    reduce ? 1 - clamp01((t - BAR_SECONDS) / 0.4) : t < REVEAL_AT ? 1 : 0,
  );

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Caricamento di Radar"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        height: "100dvh",
        overflow: "hidden",
        fontFamily: DISPLAY,
      }}
    >
      <motion.div style={{ position: "absolute", inset: 0, background: YELLOW, opacity: posterOpacity }}>
        {/* sfondo di codice, lo stesso dello Splash ma inchiostro su giallo (stile in splash.css, ".intro-code") */}
        {!reduce && (
          <div
            aria-hidden="true"
            className="intro-code"
            style={{ position: "absolute", inset: 0, containerType: "size" }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                // 1 unità Figma sullo schermo, come nello Splash
                ["--u" as string]: "min(calc(100cqw / 390), calc(100cqh / 844))",
              }}
            >
              <CodeRain />
            </div>
          </div>
        )}

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
          <Headline time={time} live={live} instant={reduce} />
          <Phrase time={time} live={live} instant={reduce} />
          {!reduce && (
            <>
              <Counter time={time} live={live} total={total} state={signals} windowText={windowText} />
              <Tape time={time} live={live} />
              <Tiles time={time} live={live} items={items} />
              <GoSticker time={time} live={live} />
            </>
          )}
          <Bar time={time} live={live} />
          {ready && !go && <ContinueHint />}
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
              <LanguageButton note={langNote} onPress={pressLanguage} />
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
