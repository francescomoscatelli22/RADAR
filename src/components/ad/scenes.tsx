"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform } from "motion/react";
import RadarMark from "./RadarMark";
import {
  Appear,
  C,
  Letters,
  Scene,
  T,
  clamp01,
  easeInOut,
  easeOut,
  type Time,
} from "./kit";

const DISPLAY = "var(--font-bricolage), system-ui, sans-serif";
const MONO = "var(--font-martian), ui-monospace, monospace";
const ACCENT = "var(--font-instrument), Georgia, serif";

const hard = (px = 6) => `${px}px ${px}px 0 ${C.ink}`;
const fullWidth: CSSProperties = { position: "absolute", left: 0, width: 1920, textAlign: "center" };

/* ============ Scena 1 · il caos (0 → 3.6 s) ============ */

const CHIPS = [
  { t: "NUOVO MODELLO!", x: 110, y: 80, r: -7, bg: C.signal, at: 0.1 },
  { t: "Thread da 47 post", x: 1330, y: 110, r: 6, bg: C.coral, at: 0.25 },
  { t: "Video · 38 min", x: 760, y: 50, r: -3, bg: C.cream, at: 0.4 },
  { t: "Release v4.2.1", x: 1480, y: 790, r: -8, bg: C.ink, at: 0.55 },
  { t: "Newsletter n.312", x: 90, y: 790, r: 5, bg: C.coral, at: 0.7 },
  { t: "Demo virale", x: 1590, y: 215, r: -5, bg: C.signal, at: 0.85 },
  { t: "Paper arXiv", x: 760, y: 920, r: 4, bg: C.ink, at: 1.0 },
  { t: "Ennesimo tool", x: 60, y: 580, r: 7, bg: C.cream, at: 1.15 },
  { t: "Podcast · 1h 12", x: 1130, y: 900, r: -4, bg: C.cream, at: 1.3 },
];

function Chip({ text, bg }: { text: string; bg: string }) {
  const dark = bg === C.ink;
  return (
    <div
      style={{
        padding: "16px 34px",
        background: bg,
        color: dark ? C.paper : C.ink,
        border: `3px solid ${C.ink}`,
        borderRadius: 12,
        boxShadow: hard(7),
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 42,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

function Scene1({ time }: { time: Time }) {
  return (
    <Scene time={time} from={0} to={T.S2} bg={C.paper}>
      {CHIPS.map((c) => (
        <Appear
          key={c.t}
          time={time}
          at={c.at}
          dur={0.5}
          from={{ y: -120, scale: 0.5, rotate: 25 }}
          rotate={c.r}
          wobble={1.8}
          style={{ position: "absolute", left: c.x, top: c.y }}
        >
          <Chip text={c.t} bg={c.bg} />
        </Appear>
      ))}

      {/* badge notifiche */}
      <Appear
        time={time}
        at={1.7}
        dur={0.45}
        from={{ scale: 0.2, rotate: -30 }}
        rotate={8}
        wobble={3}
        style={{ position: "absolute", left: 1650, top: 540 }}
      >
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: 999,
            background: C.coral,
            border: `4px solid ${C.ink}`,
            boxShadow: hard(8),
            display: "grid",
            placeItems: "center",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 86,
            color: C.paper,
          }}
        >
          99+
        </div>
      </Appear>

      <Appear time={time} at={0.5} dur={0.7} from={{ y: 140, scale: 0.9 }} style={{ ...fullWidth, top: 290 }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 290,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: C.ink,
          }}
        >
          L&apos;AI corre.
        </div>
      </Appear>

      <Appear time={time} at={1.9} dur={0.6} from={{ y: 50 }} style={{ ...fullWidth, top: 640 }}>
        <div style={{ fontFamily: ACCENT, fontStyle: "italic", fontSize: 128, color: C.coral }}>
          Tu riesci a starle dietro?
        </div>
      </Appear>
    </Scene>
  );
}

/* ============ Scena 2 · arriva Radar (3.6 → 7.4 s) ============ */

function Scene2({ time }: { time: Time }) {
  const t0 = T.S2 + 1.1;
  return (
    <Scene time={time} from={T.S2} to={T.S3} bg={C.ink}>
      <div style={{ position: "absolute", left: 170, top: 140 }}>
        <RadarMark time={time} t0={t0} size={800} />
      </div>

      <div style={{ position: "absolute", left: 1040, top: 330, color: C.paper }}>
        <Appear time={time} at={t0 + 0.2} dur={0.5} from={{ x: -30 }} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              letterSpacing: "0.18em",
              color: C.signal,
            }}
          >
            ● IL TUO RADAR PERSONALE
          </div>
        </Appear>
        <Letters
          time={time}
          at={t0 + 0.4}
          text="RADAR"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 240,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        />
        <Appear time={time} at={t0 + 1.4} dur={0.6} from={{ y: 40 }}>
          <div style={{ fontFamily: ACCENT, fontStyle: "italic", fontSize: 110, color: C.signal }}>
            sbircia il web.
          </div>
        </Appear>
      </div>
    </Scene>
  );
}

/* ============ Scena 3 · il feed (7.4 → 13.0 s) ============ */

function Label({ children, color = C.ink }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: "0.12em", fontWeight: 600, color }}>
      {children}
    </div>
  );
}

const cardBase: CSSProperties = {
  border: `3px solid ${C.ink}`,
  borderRadius: 18,
  boxShadow: hard(6),
  overflow: "hidden",
  flex: "none",
};

function VideoCard() {
  return (
    <div style={{ ...cardBase, background: C.coral }}>
      <div
        style={{
          height: 190,
          position: "relative",
          borderBottom: `3px solid ${C.ink}`,
          backgroundImage: "radial-gradient(circle, rgba(23,21,15,.32) 2.4px, transparent 2.9px)",
          backgroundSize: "16px 16px",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 999,
            background: C.paper,
            border: `3px solid ${C.ink}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              marginLeft: 8,
              borderLeft: `26px solid ${C.ink}`,
              borderTop: "16px solid transparent",
              borderBottom: "16px solid transparent",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            background: C.ink,
            color: C.paper,
            fontFamily: MONO,
            fontSize: 16,
            padding: "3px 9px",
            borderRadius: 6,
          }}
        >
          12:04
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <Label>VIDEO · 2 MIN FA</Label>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.05, marginTop: 8, color: C.ink }}>
          Video in 4K con un solo prompt
        </div>
      </div>
    </div>
  );
}

function ArticleCard() {
  return (
    <div style={{ ...cardBase, background: C.cream, padding: "18px 20px 22px" }}>
      <Label>ARTICOLO · 5 MIN</Label>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, lineHeight: 1.05, margin: "10px 0 14px", color: C.ink }}>
        UI generate dall&apos;AI: cosa cambia per chi disegna
      </div>
      {[100, 92, 64].map((w, i) => (
        <div key={i} style={{ height: 11, width: `${w}%`, background: "rgba(23,21,15,.16)", borderRadius: 6, marginTop: 9 }} />
      ))}
    </div>
  );
}

function ReleaseCard() {
  return (
    <div style={{ ...cardBase, background: C.ink, color: C.paper, padding: "18px 20px 22px" }}>
      <Label color={C.signal}>RELEASE · GITHUB</Label>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 64, color: C.signal, margin: "8px 0 6px", letterSpacing: "-0.04em" }}>
        v2.4.0
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 28 }}>Agenti più veloci del 40%</div>
    </div>
  );
}

function ThreadCard() {
  return (
    <div style={{ ...cardBase, background: C.signal, padding: "18px 20px 22px" }}>
      <Label>THREAD · 38 RISPOSTE</Label>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, lineHeight: 1.05, marginTop: 10, color: C.ink }}>
        Quale modello 3D usate davvero?
      </div>
    </div>
  );
}

function PodcastCard() {
  const bars = [30, 55, 80, 45, 95, 60, 35, 70, 50, 85, 40, 65, 30, 75, 55, 45];
  return (
    <div style={{ ...cardBase, background: C.cream, padding: "18px 20px 22px" }}>
      <Label>PODCAST · 48 MIN</Label>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.05, margin: "10px 0 14px", color: C.ink }}>
        Il futuro degli strumenti creativi
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 54 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ width: 10, height: `${h}%`, background: i < 6 ? C.coral : "rgba(23,21,15,.25)", borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}

function Phone({ time }: { time: Time }) {
  const s = T.S3;
  const scroll = useTransform(time, (t) => -640 * easeInOut(clamp01((t - (s + 2.7)) / 2.2)));
  const cards = [<VideoCard key="v" />, <ArticleCard key="a" />, <ReleaseCard key="r" />, <ThreadCard key="t" />, <PodcastCard key="p" />];
  return (
    <div
      style={{
        position: "absolute",
        left: 1120,
        top: 60,
        width: 520,
        height: 960,
        background: C.ink,
        borderRadius: 78,
        padding: 16,
        boxShadow: `14px 14px 0 ${C.coral}`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 64, background: C.paper, overflow: "hidden" }}>
        {/* isola dinamica */}
        <div style={{ position: "absolute", left: 180, top: 14, width: 130, height: 36, borderRadius: 99, background: C.ink, zIndex: 5 }} />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            zIndex: 4,
            background: C.paper,
            padding: "74px 24px 14px",
            display: "flex",
            gap: 26,
            alignItems: "baseline",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 34,
            color: C.ink,
          }}
        >
          <span style={{ borderBottom: `5px solid ${C.coral}`, paddingBottom: 4 }}>Per te</span>
          <span style={{ opacity: 0.35 }}>Seguiti</span>
          <span style={{ opacity: 0.35 }}>Salvati</span>
        </div>

        <motion.div style={{ y: scroll, padding: "146px 24px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
          {cards.map((card, i) => (
            <Appear key={i} time={time} at={s + 0.9 + i * 0.5} dur={0.6} from={{ y: 160 }}>
              {card}
            </Appear>
          ))}
        </motion.div>

        {/* notifica push */}
        <Appear
          time={time}
          at={s + 3.9}
          dur={0.5}
          out={s + 5.2}
          from={{ y: -200 }}
          style={{ position: "absolute", left: 18, right: 18, top: 58, zIndex: 6 }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              background: C.ink,
              color: C.paper,
              borderRadius: 26,
              padding: "16px 18px",
              border: `3px solid ${C.signal}`,
              boxShadow: "0 18px 40px rgba(0,0,0,.35)",
            }}
          >
            <div style={{ width: 54, height: 54, borderRadius: 14, background: C.signal, display: "grid", placeItems: "center", flex: "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 99, border: `5px solid ${C.ink}`, position: "relative" }}>
                <div style={{ position: "absolute", right: -5, top: -5, width: 13, height: 13, borderRadius: 99, background: C.coral }} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.1em", color: C.signal }}>RADAR · ADESSO</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 25, lineHeight: 1.1 }}>Nuovo modello 3D appena uscito</div>
            </div>
          </div>
        </Appear>
      </div>

      {/* adesivo */}
      <Appear
        time={time}
        at={s + 1.6}
        dur={0.5}
        from={{ scale: 0.2, rotate: -40 }}
        rotate={-10}
        style={{ position: "absolute", left: -90, top: 150, zIndex: 8 }}
      >
        <div
          style={{
            background: C.signal,
            border: `4px solid ${C.ink}`,
            borderRadius: 999,
            padding: "14px 38px",
            boxShadow: hard(7),
            fontFamily: ACCENT,
            fontStyle: "italic",
            fontSize: 60,
            color: C.ink,
          }}
        >
          sempre fresco
        </div>
      </Appear>
    </div>
  );
}

function Scene3({ time }: { time: Time }) {
  const s = T.S3;
  const formats = [
    { t: "Video", bg: C.coral },
    { t: "Articoli", bg: C.cream },
    { t: "Release", bg: C.ink },
    { t: "Thread", bg: C.signal },
    { t: "Podcast", bg: C.cream },
  ];
  return (
    <Scene time={time} from={T.S3} to={T.S4} bg={C.paper}>
      <div style={{ position: "absolute", left: 110, top: 190, width: 940 }}>
        <Appear time={time} at={s + 0.3} dur={0.5} from={{ x: -40 }} style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "inline-block",
              background: C.ink,
              color: C.signal,
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: "0.14em",
              padding: "10px 22px",
              borderRadius: 8,
            }}
          >
            FEED CRONOLOGICO · PER TE
          </div>
        </Appear>
        <Appear time={time} at={s + 0.5} dur={0.7} from={{ y: 90 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 0.95, letterSpacing: "-0.04em", color: C.ink }}>
            Il web dell&apos;AI,
          </div>
        </Appear>
        <Appear time={time} at={s + 0.9} dur={0.7} from={{ y: 70 }}>
          <div style={{ fontFamily: ACCENT, fontStyle: "italic", fontSize: 170, lineHeight: 1, color: C.coral }}>
            senza rumore.
          </div>
        </Appear>
        <div style={{ display: "flex", flexWrap: "nowrap", gap: 14, marginTop: 56, marginLeft: -20 }}>
          {formats.map((f, i) => (
            <Appear key={f.t} time={time} at={s + 1.6 + i * 0.14} dur={0.45} from={{ y: 40, scale: 0.7 }}>
              <div
                style={{
                  background: f.bg,
                  color: f.bg === C.ink ? C.paper : C.ink,
                  border: `3px solid ${C.ink}`,
                  borderRadius: 12,
                  boxShadow: hard(5),
                  padding: "10px 22px",
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  fontSize: 34,
                }}
              >
                {f.t}
              </div>
            </Appear>
          ))}
        </div>
      </div>
      <Phone time={time} />
    </Scene>
  );
}

/* ============ Scena 4 · scegli i tuoi argomenti (13.0 → 17.0 s) ============ */

const ROWS: { t: string; sel?: number }[][] = [
  [{ t: "AI", sel: 1.3 }, { t: "AI generativa", sel: 1.5 }, { t: "Immagini", sel: 1.75 }, { t: "Video", sel: 2.0 }, { t: "UI / UX", sel: 2.25 }],
  [{ t: "3D", sel: 2.5 }, { t: "Agenti", sel: 2.7 }, { t: "Modelli" }, { t: "Open source" }, { t: "Design" }],
  [{ t: "Strumenti" }, { t: "Audio" }, { t: "Robotica" }, { t: "Ricerca" }, { t: "Prompt" }],
];

function TopicChip({ time, label, at, sel }: { time: Time; label: string; at: number; sel?: number }) {
  const bg = useTransform(time, (t) => (sel !== undefined && t >= sel ? C.signal : C.cream));
  const scale = useTransform(time, (t) => (sel === undefined ? 1 : 1 + 0.16 * Math.sin(Math.PI * clamp01((t - sel) / 0.4))));
  const dot = useTransform(time, (t) => (sel !== undefined && t >= sel ? C.coral : "rgba(0,0,0,0)"));
  return (
    <Appear time={time} at={at} dur={0.45} from={{ y: 50, scale: 0.6 }}>
      <motion.div
        style={{
          scale,
          background: bg,
          border: `3px solid ${C.ink}`,
          borderRadius: 14,
          boxShadow: hard(6),
          padding: "14px 30px 14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 50,
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        <motion.span style={{ width: 26, height: 26, borderRadius: 99, border: `4px solid ${C.ink}`, background: dot, display: "block" }} />
        {label}
      </motion.div>
    </Appear>
  );
}

function Counter({ time }: { time: Time }) {
  const s = T.S4;
  const times = ROWS.flat().flatMap((c) => (c.sel !== undefined ? [s + c.sel] : []));
  const [n, setN] = useState(0);
  useMotionValueEvent(time, "change", (t) => setN(times.filter((x) => t >= x).length));
  return (
    <span>
      {n} argomenti scelti
    </span>
  );
}

function Scene4({ time }: { time: Time }) {
  const s = T.S4;
  let k = 0;
  return (
    <Scene time={time} from={T.S4} to={T.S5} bg={C.paper}>
      <Appear time={time} at={s + 0.2} dur={0.6} from={{ y: 70 }} style={{ ...fullWidth, top: 90 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 140, letterSpacing: "-0.04em", lineHeight: 1, color: C.ink }}>
          Scegli cosa ti <span style={{ fontFamily: ACCENT, fontStyle: "italic", fontWeight: 400, color: C.coral }}>interessa.</span>
        </div>
      </Appear>

      <div style={{ position: "absolute", left: 0, width: 1920, top: 320, display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
        {ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 30 }}>
            {row.map((c) => (
              <TopicChip key={c.t} time={time} label={c.t} at={s + 0.5 + 0.06 * k++} sel={c.sel !== undefined ? s + c.sel : undefined} />
            ))}
          </div>
        ))}
      </div>

      <Appear time={time} at={s + 1.2} dur={0.5} from={{ y: 30 }} style={{ ...fullWidth, top: 800 }}>
        <div style={{ display: "inline-block", background: C.ink, color: C.signal, fontFamily: MONO, fontSize: 36, letterSpacing: "0.08em", padding: "14px 30px", borderRadius: 10 }}>
          <Counter time={time} />
        </div>
      </Appear>
      <Appear time={time} at={s + 2.4} dur={0.6} from={{ y: 40 }} style={{ ...fullWidth, top: 900 }}>
        <div style={{ fontFamily: ACCENT, fontStyle: "italic", fontSize: 80, color: C.ink }}>
          Solo quello che scegli. Niente altro.
        </div>
      </Appear>
    </Scene>
  );
}

/* ============ Scena 5 · chiusura (17.0 → 20 s) ============ */

const TICK = ["AI", "AI generativa", "Immagini", "Video", "UI / UX", "3D", "Agenti", "Modelli"];
const TICK_W = 380;

function Ticker({ time }: { time: Time }) {
  const group = TICK.length * TICK_W;
  const x = useTransform(time, (t) => -((t * 240) % group));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: -60,
        top: 960,
        width: 2100,
        height: 96,
        background: C.signal,
        borderTop: `4px solid ${C.ink}`,
        borderBottom: `4px solid ${C.ink}`,
        rotate: -1.4,
        overflow: "hidden",
      }}
    >
      <motion.div style={{ x, display: "flex", width: group * 2, height: "100%", alignItems: "center" }}>
        {[0, 1].flatMap((g) =>
          TICK.map((w) => (
            <div key={`${g}-${w}`} style={{ width: TICK_W, flex: "none", fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, color: C.ink, whiteSpace: "nowrap" }}>
              ✦ {w}
            </div>
          )),
        )}
      </motion.div>
    </motion.div>
  );
}

function Scene5({ time }: { time: Time }) {
  const s = T.S5;
  const t0 = s + 0.5;
  return (
    <Scene time={time} from={T.S5} to={T.END + 1} bg={C.ink}>
      <div style={{ position: "absolute", left: 740, top: 20 }}>
        <RadarMark time={time} t0={t0} size={440} />
      </div>
      <div style={{ ...fullWidth, top: 470, color: C.paper }}>
        <Letters
          time={time}
          at={t0 + 0.2}
          text="RADAR"
          style={{ justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 210, lineHeight: 1, letterSpacing: "-0.04em" }}
        />
      </div>
      <Appear time={time} at={t0 + 1.0} dur={0.6} from={{ y: 40 }} style={{ ...fullWidth, top: 690 }}>
        <div style={{ fontFamily: ACCENT, fontStyle: "italic", fontSize: 92, color: C.signal }}>sbircia il web.</div>
      </Appear>
      <Appear time={time} at={t0 + 1.5} dur={0.5} from={{ y: 40, scale: 0.8 }} style={{ ...fullWidth, top: 825 }}>
        <div
          style={{
            display: "inline-block",
            background: C.paper,
            color: C.ink,
            border: `3px solid ${C.ink}`,
            borderRadius: 14,
            boxShadow: `7px 7px 0 ${C.coral}`,
            padding: "10px 34px",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 44,
          }}
        >
          Installala dal browser
        </div>
      </Appear>
      <Ticker time={time} />
    </Scene>
  );
}

export { Scene1, Scene2, Scene3, Scene4, Scene5 };
export { easeOut };
