"use client";

import { motion, useTransform } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { ACCENT_SERIF, DISPLAY, MONO, backOut, clamp01, easeOut, type Time } from "./timeline";

/*
  I 6 formati del feed come blocchi Zine (bordo spesso, ombra dura), ognuno con una micro-animazione:
  video, post, articolo, thread, release, podcast.
  Arrivano uno dopo l'altro dai lati, come adesivi sbattuti sul poster (entrano con un rimbalzo), e restano lì.
*/

const W = 166;
const H = 92;
const INK = "var(--color-card-ink)";
const READING = "var(--font-newsreader), Georgia, serif";

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

type BodyProps = { time: Time; at: number };

// ---------- video: il play pulsa e la barra di avanzamento si riempie ----------
function VideoBody({ time, at }: BodyProps) {
  const fill = useTransform(time, (t) => `${100 * clamp01((t - at - 0.2) / 2.2)}%`);
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
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 12, lineHeight: 1.05 }}>
          Un logo con l&apos;AI in 60 secondi
        </span>
        <div style={{ height: 7, boxSizing: "border-box", border: `2px solid ${INK}`, background: "rgba(0,0,0,0.12)" }}>
          <motion.div style={{ height: "100%", width: fill, background: INK }} />
        </div>
      </div>
    </div>
  );
}

// ---------- post: il testo si scrive da solo ----------
const POST_TEXT = "Il miglior prompt è una buona domanda.";
function PostBody({ time, at }: BodyProps) {
  const typed = useTyped(time, POST_TEXT, at + 0.3, 1.4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            flex: "none",
            width: 22,
            height: 22,
            boxSizing: "border-box",
            border: `2px solid ${INK}`,
            borderRadius: "50%",
            background: "var(--color-platform-post)",
            color: "var(--color-cream)",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 8,
          }}
        >
          GV
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <b style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 10, lineHeight: 1 }}>Giulia Verdi</b>
          <small style={{ fontFamily: MONO, fontSize: 7, lineHeight: 1 }}>UX Research · Roma</small>
        </span>
      </div>
      <motion.p style={{ margin: 0, fontFamily: READING, fontSize: 11.5, lineHeight: 1.1, minHeight: 25 }}>
        {typed}
      </motion.p>
    </div>
  );
}

// ---------- articolo: i titoli salgono da sotto una "finestra" ----------
function ArticleLine({ time, start, children }: { time: Time; start: number; children: ReactNode }) {
  const y = useTransform(time, (t) => `${(1 - easeOut(clamp01((t - start) / 0.45))) * 115}%`);
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

function ArticleBody({ time, at }: BodyProps) {
  const headline: CSSProperties = {
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.08,
    letterSpacing: "-0.015em",
  };
  const accentOpacity = useTransform(time, (t) => clamp01((t - at - 0.9) / 0.3));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={headline}>
        <ArticleLine time={time} start={at + 0.15}>
          Che cos&apos;è un modello
        </ArticleLine>
        <ArticleLine time={time} start={at + 0.3}>
          multimodale?
        </ArticleLine>
      </div>
      <motion.span style={{ opacity: accentOpacity, fontFamily: ACCENT_SERIF, fontStyle: "italic", fontSize: 14, lineHeight: 1 }}>
        spiegato bene.
      </motion.span>
    </div>
  );
}

// ---------- thread: il contatore dei punti sale ----------
function ThreadBody({ time, at }: BodyProps) {
  const points = useTransform(time, (t) => String(Math.round(482 * easeOut(clamp01((t - at - 0.1) / 1.5)))));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 64 }}>
        <span style={{ fontSize: 9, lineHeight: 1 }}>▲</span>
        <motion.b
          style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, lineHeight: 0.9, letterSpacing: "-0.06em" }}
        >
          {points}
        </motion.b>
      </div>
      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 10.5, lineHeight: 1.05 }}>
        Show HN: un editor di video nel browser
      </span>
    </div>
  );
}

// ---------- release: il registro delle modifiche si scrive nel pannello nero ----------
function CodeLine({ time, text, start, bold }: { time: Time; text: string; start: number; bold?: boolean }) {
  const typed = useTyped(time, text, start, 0.4);
  return (
    <motion.span style={{ fontWeight: bold ? 700 : 400, whiteSpace: "nowrap", minHeight: 10 }}>{typed}</motion.span>
  );
}

function ReleaseBody({ time, at }: BodyProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: 1,
        minHeight: 0,
        padding: "5px 7px",
        background: "#000",
        color: "var(--color-cream)",
        fontFamily: MONO,
        fontSize: 8,
        lineHeight: 1.25,
      }}
    >
      <CodeLine time={time} text="v2.4.0 · AGENT-KIT" start={at + 0.2} bold />
      <CodeLine time={time} text="+ sub-agenti in parallelo" start={at + 0.65} />
      <CodeLine time={time} text="~ fix: memoria sessione" start={at + 1.1} />
    </div>
  );
}

// ---------- podcast: la forma d'onda pulsa ----------
function WaveBar({ time, at, i }: BodyProps & { i: number }) {
  const scaleY = useTransform(time, (t) => {
    const grow = easeOut(clamp01((t - at - 0.15 - i * 0.02) / 0.4));
    return grow * (0.2 + 0.8 * Math.abs(Math.sin(t * 5.5 + i * 0.75)));
  });
  return <motion.i style={{ display: "block", flex: "none", width: 4, height: 38, background: INK, scaleY }} />;
}

function PodcastBody({ time, at }: BodyProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          flex: "none",
          width: 40,
          height: 40,
          boxSizing: "border-box",
          border: `2.5px solid ${INK}`,
          background: "var(--color-platform-video)",
        }}
      >
        <Play size={11} color="var(--color-cream)" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, height: 40 }}>
        {Array.from({ length: 14 }, (_, i) => (
          <WaveBar key={i} time={time} at={at} i={i} />
        ))}
      </div>
    </div>
  );
}

// ---------- i sei blocchi ----------
type Spec = {
  id: string;
  x: number;
  y: number;
  rot: number;
  bg: string;
  label: string;
  meta: string;
  Body: (p: BodyProps) => ReactNode;
};

const SPECS: Spec[] = [
  { id: "video", x: 24, y: 396, rot: -1.5, bg: "var(--color-card-video)", label: "VIDEO", meta: "YOUTUBE", Body: VideoBody },
  { id: "post", x: 200, y: 402, rot: 1.2, bg: "var(--color-card-post)", label: "POST", meta: "LINKEDIN", Body: PostBody },
  { id: "article", x: 24, y: 498, rot: 1, bg: "var(--color-cream)", label: "ARTICOLO", meta: "3 H", Body: ArticleBody },
  { id: "thread", x: 200, y: 504, rot: -1.2, bg: "var(--color-card-thread)", label: "THREAD", meta: "HN", Body: ThreadBody },
  { id: "release", x: 24, y: 600, rot: -1, bg: "var(--color-card-code)", label: "RELEASE", meta: "GITHUB", Body: ReleaseBody },
  { id: "podcast", x: 200, y: 606, rot: 1.5, bg: "var(--color-card-audio)", label: "PODCAST", meta: "42 MIN", Body: PodcastBody },
];

const FIRST_AT = 1.0; // il primo blocco arriva a 1 s
const GAP = 0.32; // e gli altri a distanza di 0,32 s

function Tile({ time, spec, index }: { time: Time; spec: Spec; index: number }) {
  const { x, y, rot, bg, label, meta, Body } = spec;
  const at = FIRST_AT + index * GAP;
  // quelli di sinistra arrivano da sinistra, quelli di destra da destra
  const side = x < 100 ? -1 : 1;
  const dir = rot < 0 ? -1 : 1;

  const enter = (t: number) => backOut(clamp01((t - at) / 0.6));

  const tx = useTransform(time, (t) => side * 420 * (1 - enter(t)));
  const ty = useTransform(time, (t) => 40 * (1 - enter(t)));
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
        <span style={{ opacity: 0.6 }}>{meta}</span>
      </div>
      <Body time={time} at={at} />
    </motion.div>
  );
}

export default function Tiles({ time }: { time: Time }) {
  return (
    <>
      {SPECS.map((spec, i) => (
        <Tile key={spec.id} time={time} spec={spec} index={i} />
      ))}
    </>
  );
}
