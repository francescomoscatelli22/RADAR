"use client";

import { motion, useTransform } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import type { Signal, SignalKind } from "@/lib/signals";
import { ACCENT_SERIF, DISPLAY, MONO, backOut, clamp01, easeOut, type Time } from "./timeline";

/*
  I blocchi dei formati del feed come adesivi Zine (bordo spesso, ombra dura), ognuno con una micro-animazione.
  Il CONTENUTO è vero: sono gli ultimi contenuti raccolti da Radar per ogni formato (video, articoli, thread,
  release, podcast), arrivati da /api/signals. Se un formato non ha ancora contenuti, il suo blocco non c'è;
  se il database non risponde non compare nessun blocco (mai contenuti inventati).
  Il formato "post" (LinkedIn) non esiste: non si può leggere. Al suo posto c'è un secondo articolo.
  Arrivano uno dopo l'altro dai lati, come adesivi sbattuti sul poster (entrano con un rimbalzo), e restano lì.
*/

const W = 166;
const H = 92;
const INK = "var(--color-card-ink)";
const READING = "var(--font-newsreader), Georgia, serif";

/** Taglia il testo a N righe con i puntini finali. */
const clampLines = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const oneLine: CSSProperties = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

/** "3 H FA", "12 MIN FA", "2 G FA" */
function agoText(minutes: number) {
  if (minutes < 1) return "ORA";
  if (minutes < 60) return `${minutes} MIN FA`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} H FA`;
  return `${Math.round(hours / 24)} G FA`;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Testo che si scrive da solo, lettera per lettera (con cursore finché non ha finito). */
function useTyped(time: Time, text: string, start: number, dur: number) {
  return useTransform(time, (t) => {
    const n = Math.floor(clamp01((t - start) / dur) * text.length);
    return text.slice(0, n) + (n < text.length && t >= start ? "▍" : "");
  });
}

/** Triangolo "play" fatto con CSS. */
function Play({ size, color }: { size: number; color: string }) {
  return (
    <i
      style={{
        display: "block",
        width: size,
        height: size * 1.15,
        background: color,
        clipPath: "polygon(0 0, 100% 50%, 0 100%)",
        marginLeft: size * 0.18,
      }}
    />
  );
}

type BodyProps = { time: Time; at: number; signal: Signal };

// ---------- video: il play pulsa e la barra di avanzamento si riempie ----------
function VideoBody({ time, at, signal }: BodyProps) {
  // la barra del video si riempie e riparte da capo, come un video che gira
  const fill = useTransform(time, (t) => `${t < at + 0.2 ? 0 : (((t - at - 0.2) % 3.6) / 3.6) * 100}%`);
  const pulse = useTransform(time, (t) => 1 + 0.14 * Math.sin((t - at) * 7));
  return (
    <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          flex: "none",
          width: 46,
          height: 46,
          boxSizing: "border-box",
          border: `2.5px solid ${INK}`,
          background: "var(--color-thumb)",
        }}
      >
        <motion.span
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            boxSizing: "border-box",
            border: `2px solid ${INK}`,
            borderRadius: "50%",
            background: "var(--color-accent)",
            scale: pulse,
          }}
        >
          <Play size={7} color={INK} />
        </motion.span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0, flex: 1 }}>
        <span style={{ ...clampLines(3), fontFamily: DISPLAY, fontWeight: 700, fontSize: 11, lineHeight: 1.05 }}>
          {signal.title}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <small style={{ ...oneLine, fontFamily: MONO, fontSize: 7, lineHeight: 1, textTransform: "uppercase" }}>
            {signal.source}
          </small>
          <div style={{ height: 6, boxSizing: "border-box", border: `2px solid ${INK}`, background: "rgba(0,0,0,0.12)" }}>
            <motion.div style={{ height: "100%", width: fill, background: INK }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- articolo (versione "scritto a macchina"): il titolo si scrive da solo ----------
function TypedArticleBody({ time, at, signal }: BodyProps) {
  const typed = useTyped(time, signal.title, at + 0.4, Math.min(3, signal.title.length * 0.04));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            flex: "none",
            width: 20,
            height: 20,
            boxSizing: "border-box",
            border: `2px solid ${INK}`,
            borderRadius: "50%",
            background: "var(--color-platform-post)",
            color: "var(--color-cream)",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 7.5,
          }}
        >
          {initials(signal.source)}
        </span>
        <b style={{ ...oneLine, fontFamily: DISPLAY, fontWeight: 700, fontSize: 10, lineHeight: 1 }}>{signal.source}</b>
      </div>
      <motion.p style={{ ...clampLines(3), margin: 0, fontFamily: READING, fontSize: 11, lineHeight: 1.08 }}>
        {typed}
      </motion.p>
    </div>
  );
}

// ---------- articolo: il titolo sale da sotto una "finestra" ----------
function ArticleBody({ time, at, signal }: BodyProps) {
  const y = useTransform(time, (t) => `${(1 - easeOut(clamp01((t - at - 0.15) / 0.5))) * 115}%`);
  const sourceOpacity = useTransform(time, (t) => clamp01((t - at - 0.9) / 0.3));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minHeight: 0 }}>
      <div style={{ overflow: "hidden" }}>
        <motion.div
          style={{
            ...clampLines(3),
            y,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 12,
            lineHeight: 1.08,
            letterSpacing: "-0.015em",
          }}
        >
          {signal.title}
        </motion.div>
      </div>
      <motion.span
        style={{ ...oneLine, opacity: sourceOpacity, fontFamily: ACCENT_SERIF, fontStyle: "italic", fontSize: 13, lineHeight: 1 }}
      >
        {signal.source}
      </motion.span>
    </div>
  );
}

// ---------- thread: il contatore dei punti sale fino ai punti veri ----------
function ThreadBody({ time, at, signal }: BodyProps) {
  const total = signal.points ?? 0;
  const points = useTransform(time, (t) => String(Math.round(total * easeOut(clamp01((t - at - 0.1) / 2.8)))));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 64 }}>
        <span style={{ fontSize: 9, lineHeight: 1 }}>▲</span>
        <motion.b
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: total >= 1000 ? 28 : 38,
            lineHeight: 0.9,
            letterSpacing: "-0.06em",
          }}
        >
          {points}
        </motion.b>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ ...clampLines(3), fontFamily: DISPLAY, fontWeight: 700, fontSize: 10, lineHeight: 1.05 }}>
          {signal.title}
        </span>
        <small style={{ ...oneLine, fontFamily: MONO, fontSize: 7, lineHeight: 1 }}>{signal.comments ?? 0} COMMENTI</small>
      </div>
    </div>
  );
}

// ---------- release: il pannello nero si "scrive" con i dati della release ----------
function CodeLine({ time, text, start, bold }: { time: Time; text: string; start: number; bold?: boolean }) {
  const typed = useTyped(time, text, start, 0.9);
  return <motion.span style={{ ...oneLine, fontWeight: bold ? 700 : 400, minHeight: 10 }}>{typed}</motion.span>;
}

function ReleaseBody({ time, at, signal }: BodyProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        padding: "5px 7px",
        background: "#000",
        color: "var(--color-cream)",
        fontFamily: MONO,
        fontSize: 8,
        lineHeight: 1.25,
      }}
    >
      <CodeLine time={time} text={`${signal.title} · ${signal.source.toUpperCase()}`} start={at + 0.4} bold />
      <CodeLine time={time} text="nuova release" start={at + 1.4} />
      <CodeLine time={time} text={agoText(signal.ageMinutes).toLowerCase()} start={at + 2.5} />
    </div>
  );
}

// ---------- podcast: la forma d'onda pulsa ----------
function WaveBar({ time, at, i }: { time: Time; at: number; i: number }) {
  const scaleY = useTransform(time, (t) => {
    const grow = easeOut(clamp01((t - at - 0.15 - i * 0.02) / 0.4));
    return grow * (0.2 + 0.8 * Math.abs(Math.sin(t * 5.5 + i * 0.75)));
  });
  return <motion.i style={{ display: "block", flex: "none", width: 4, height: 14, background: INK, scaleY }} />;
}

function PodcastBody({ time, at, signal }: BodyProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          flex: "none",
          width: 34,
          height: 34,
          boxSizing: "border-box",
          border: `2.5px solid ${INK}`,
          background: "var(--color-platform-video)",
        }}
      >
        <Play size={10} color="var(--color-cream)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{ ...clampLines(2), fontFamily: DISPLAY, fontWeight: 700, fontSize: 10, lineHeight: 1.05 }}>
          {signal.title}
        </span>
        <small style={{ ...oneLine, fontFamily: MONO, fontSize: 7, lineHeight: 1, textTransform: "uppercase" }}>
          {signal.source}
        </small>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 14 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <WaveBar key={i} time={time} at={at} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- i blocchi ----------
type Kind = SignalKind | "article-typed";

const STYLE: Record<Kind, { bg: string; label: string; Body: (p: BodyProps) => ReactNode }> = {
  video: { bg: "var(--color-card-video)", label: "VIDEO", Body: VideoBody },
  "article-typed": { bg: "var(--color-card-post)", label: "ARTICOLO", Body: TypedArticleBody },
  article: { bg: "var(--color-cream)", label: "ARTICOLO", Body: ArticleBody },
  thread: { bg: "var(--color-card-thread)", label: "THREAD", Body: ThreadBody },
  release: { bg: "var(--color-card-code)", label: "RELEASE", Body: ReleaseBody },
  podcast: { bg: "var(--color-card-audio)", label: "PODCAST", Body: PodcastBody },
};

// i sei posti sul poster (a coppie, leggermente storti)
const SLOTS = [
  { x: 24, y: 396, rot: -1.5 },
  { x: 200, y: 402, rot: 1.2 },
  { x: 24, y: 498, rot: 1 },
  { x: 200, y: 504, rot: -1.2 },
  { x: 24, y: 600, rot: -1 },
  { x: 200, y: 606, rot: 1.5 },
];

const FIRST_AT = 2.8; // il primo blocco arriva a 2,8 s, dopo le parole giganti
const GAP = 0.6; // e gli altri a distanza di 0,6 s (l'ultimo arriva a 5,8 s)

type Placed = { kind: Kind; signal: Signal };

/** Mette i contenuti veri nell'ordine del poster; salta i formati che non hanno contenuti. */
function arrange(items: Signal[]): Placed[] {
  const articles = items.filter((s) => s.kind === "article");
  const find = (kind: SignalKind) => items.find((s) => s.kind === kind);
  const order: (Placed | null)[] = [
    find("video") ? { kind: "video", signal: find("video")! } : null,
    articles[1] ? { kind: "article-typed", signal: articles[1] } : null,
    articles[0] ? { kind: "article", signal: articles[0] } : null,
    find("thread") ? { kind: "thread", signal: find("thread")! } : null,
    find("release") ? { kind: "release", signal: find("release")! } : null,
    find("podcast") ? { kind: "podcast", signal: find("podcast")! } : null,
  ];
  return order.filter((p): p is Placed => p !== null);
}

function Tile({ time, placed, index }: { time: Time; placed: Placed; index: number }) {
  const { x, y, rot } = SLOTS[index];
  const { bg, label, Body } = STYLE[placed.kind];
  const { signal } = placed;
  const at = FIRST_AT + index * GAP;
  // quelli di sinistra arrivano da sinistra, quelli di destra da destra
  const side = x < 100 ? -1 : 1;
  const dir = rot < 0 ? -1 : 1;

  const enter = (t: number) => backOut(clamp01((t - at) / 0.6));

  const tx = useTransform(time, (t) => side * 420 * (1 - enter(t)));
  // dopo l'arrivo il blocco "respira" piano su e giù, così lo schermo non si ferma mai
  const ty = useTransform(
    time,
    (t) => 40 * (1 - enter(t)) + Math.sin((t - at) * 1.7 + index * 1.3) * 2.4 * clamp01((t - at - 0.7) / 0.6),
  );
  const scale = useTransform(time, (t) => 0.7 + 0.3 * enter(t));
  const rotate = useTransform(time, (t) => rot + dir * 22 * (1 - enter(t)));
  const opacity = useTransform(time, (t) => clamp01((t - at) / 0.1));

  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: W,
        height: H,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "6px 7px",
        overflow: "hidden",
        border: `3px solid ${INK}`,
        boxShadow: `4px 4px 0 ${INK}`,
        background: bg,
        color: INK,
        x: tx,
        y: ty,
        scale,
        rotate,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.6 }}>{agoText(signal.ageMinutes)}</span>
      </div>
      <Body time={time} at={at} signal={signal} />
    </motion.div>
  );
}

export default function Tiles({ time, items }: { time: Time; items: Signal[] }) {
  return (
    <>
      {arrange(items).map((placed, i) => (
        <Tile key={`${placed.kind}-${placed.signal.title}`} time={time} placed={placed} index={i} />
      ))}
    </>
  );
}
