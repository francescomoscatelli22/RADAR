"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { POOL, type Item, type Type } from "./news";
import { u } from "./geometry";

/*
  La card in evidenza sotto il radar: UNA sola alla volta, grande e leggibile.
  Ogni 2 secondi esce e ne entra un'altra, di un formato diverso
  (video, post, articolo, thread, release, podcast) e con una notizia diversa.
  Le notizie sono di esempio (vedi news.ts).
*/

const CENTER = { x: 195, y: 538 };
// ogni card arriva con una piccola inclinazione e uno spostamento diversi
const TILTS = [-2, 1.5, -1.5, 2];
const SHIFTS = [0, -6, 5, -4];

const FIRST_DELAY_S = 0.9; // la prima card entra dopo che il radar si è disegnato
const CHANGE_MS = 2000; // poi cambia ogni 2 secondi

const COLOR: Record<Type, string> = {
  video: "--color-card-video",
  post: "--color-card-post",
  article: "--color-card-article",
  thread: "--color-card-thread",
  release: "--color-card-code",
  audio: "--color-card-audio",
};

// adesivo di ogni formato (il post ha il nastro adesivo)
const STICKER: Record<Type, { text: string; cls: string; rot: number } | null> = {
  video: { text: "NUOVO!", cls: "splash-sticker-new", rot: 8 },
  post: null,
  article: { text: "LEGGI!", cls: "splash-sticker-hot", rot: 7 },
  thread: { text: "HOT", cls: "splash-sticker-hot", rot: 10 },
  release: { text: "NUOVA!", cls: "splash-sticker-new", rot: 8 },
  audio: { text: "ON AIR", cls: "splash-sticker-hot", rot: 7 },
};

const WAVE = [8, 18, 12, 24, 9, 16, 28, 13, 20, 8, 17, 11, 25, 14, 9, 19, 12, 22, 10, 16, 8, 21, 13, 9];

type Live = { item: Item; n: number; life: number; delay: number };

function Play({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 10 10" width={u(size)} height={u(size)} aria-hidden="true" focusable="false">
      <path d="M2 0L10 5L2 10Z" fill="#000" />
    </svg>
  );
}

// prossima notizia: formato diverso da quello attuale e da quello prima
function pickNext(current: Item, previous: Item | null, cursor: number) {
  for (let i = 1; i <= POOL.length; i++) {
    const idx = (cursor + i) % POOL.length;
    const it = POOL[idx];
    if (it.type !== current.type && it.type !== previous?.type && it.id !== current.id) return idx;
  }
  return (cursor + 1) % POOL.length;
}

function Body({ item }: { item: Item }) {
  switch (item.type) {
    case "video":
      return (
        <div className="hc-row">
          <div className="hc-thumb">
            <i className="hc-sq" />
            <i className="hc-sun" />
            <i className="hc-play">
              <Play />
            </i>
          </div>
          <div className="hc-col">
            <small>{item.tag}</small>
            <b className="hc-title">{item.title}</b>
          </div>
        </div>
      );
    case "post":
      return (
        <>
          <div className="hc-author">
            <i className="hc-avatar">{item.initials}</i>
            <div className="hc-col">
              <b className="hc-name">{item.name}</b>
              <small>{item.role}</small>
            </div>
          </div>
          <p className="hc-body">{item.body}</p>
        </>
      );
    case "article":
      return (
        <>
          <small>{item.tag}</small>
          <b className="hc-headline">{item.title}</b>
          <p className="hc-excerpt">{item.excerpt}</p>
        </>
      );
    case "thread":
      return (
        <div className="hc-row">
          <div className="hc-points">
            <b>{item.points}</b>
            <small>PUNTI</small>
          </div>
          <div className="hc-col">
            <small>HACKER NEWS · THREAD</small>
            <b className="hc-title">{item.title}</b>
          </div>
        </div>
      );
    case "release":
      return (
        <>
          <small>GITHUB · {item.repo}</small>
          <div className="hc-code">
            <b>{item.version}</b>
            {item.notes.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </>
      );
    case "audio":
      return (
        <>
          <small>{item.tag}</small>
          <div className="hc-row">
            <i className="hc-playsq">
              <Play size={18} />
            </i>
            <div className="hc-col">
              <b className="hc-title">{item.title}</b>
              <small>{item.meta}</small>
            </div>
          </div>
          <div className="hc-wave">
            {WAVE.map((h, i) => (
              <i key={i} style={{ height: u(h) }} />
            ))}
          </div>
        </>
      );
  }
}

function Card({ live }: { live: Live }) {
  const t = live.item.type;
  const sticker = STICKER[t];
  const tilt = TILTS[live.n % TILTS.length];
  const shift = SHIFTS[live.n % SHIFTS.length];

  return (
    <div
      className="splash-card"
      style={
        {
          left: u(CENTER.x + shift),
          top: u(CENTER.y),
          background: `var(${COLOR[t]})`,
          "--rot": `${tilt}deg`,
          "--delay": `${live.delay}s`,
          "--life": `${live.life}s`,
        } as CSSProperties
      }
    >
      <Body item={live.item} />
      {sticker && (
        <span
          className={`splash-sticker splash-card-sticker ${sticker.cls}`}
          style={{ "--rot": `${sticker.rot}deg` } as CSSProperties}
        >
          {sticker.text}
        </span>
      )}
      {t === "post" && <span className="splash-tapepiece splash-card-tape" />}
    </div>
  );
}

export default function SignalCard() {
  const [live, setLive] = useState<Live>({
    item: POOL[0],
    n: 0,
    life: FIRST_DELAY_S + CHANGE_MS / 1000,
    delay: FIRST_DELAY_S,
  });
  const state = useRef({ current: POOL[0], previous: null as Item | null, cursor: 0, n: 0 });

  useEffect(() => {
    // con "Riduci movimento" la card resta ferma
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const advance = () => {
      const s = state.current;
      const idx = pickNext(s.current, s.previous, s.cursor);
      s.previous = s.current;
      s.current = POOL[idx];
      s.cursor = idx;
      s.n += 1;
      setLive({ item: POOL[idx], n: s.n, life: CHANGE_MS / 1000, delay: 0 });
    };

    const start = setTimeout(() => {
      advance();
      interval = setInterval(advance, CHANGE_MS);
    }, (FIRST_DELAY_S + CHANGE_MS / 1000) * 1000);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="splash-herozone">
      <Card key={live.n} live={live} />
    </div>
  );
}
