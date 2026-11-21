"use client";

import { useEffect, useMemo, useState } from "react";
import { FORMAT_LABEL, PLATFORM_FORMAT, type Format, type SourceInfo } from "@/lib/feed";
import { radar, useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon, { type IconName } from "@/components/ui/Icon";

const FORMAT_ICON: Record<Exclude<Format, "all">, IconName> = {
  video: "play",
  article: "article",
  podcast: "headphones",
  thread: "message",
  release: "package",
};

const FORMATS: Format[] = ["all", "video", "article", "podcast", "thread", "release"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Elenco di tutte le fonti di Radar, con ricerca e filtro per formato: da qui si segue. */
export default function SourceDirectory() {
  const { follows } = useRadar();
  const [sources, setSources] = useState<SourceInfo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<Format>("all");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/sources", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { sources: SourceInfo[] }) => {
        setSources(d.sources);
        setFailed(false);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setFailed(true);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const isFollowed = (s: SourceInfo) => follows.some((f) => f.ids.some((id) => s.ids.includes(id)));

  const visible = useMemo(() => {
    const q = norm(search.trim());
    return (sources ?? []).filter(
      (s) => (format === "all" || PLATFORM_FORMAT[s.platform] === format) && (!q || norm(s.name).includes(q)),
    );
  }, [sources, search, format]);

  if (failed) {
    return (
      <div className="border-[3px] border-cream bg-surface p-5 text-center shadow-zine" role="alert">
        <p className="font-display text-xl font-extrabold">Non riesco a caricare le fonti</p>
        <Button className="mt-4" onClick={() => setAttempt((a) => a + 1)}>
          <Icon name="refresh" size={18} /> Riprova
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <label htmlFor="source-search" className="sr-only">
          Cerca una fonte
        </label>
        <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-2" />
        <input
          id="source-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca una fonte (es. OpenAI, Figma)"
          className="h-12 w-full border-[3px] border-cream bg-surface pl-11 pr-3 font-display text-base text-cream placeholder:text-cream-2/70"
        />
      </div>

      <div role="group" aria-label="Filtra le fonti per formato" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {FORMATS.map((f) => (
          <Chip key={f} selected={format === f} onClick={() => setFormat(f)}>
            {FORMAT_LABEL[f]}
          </Chip>
        ))}
      </div>

      {!sources ? (
        <ul className="mt-5 flex flex-col gap-3" role="status" aria-label="Carico le fonti">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="skeleton h-16" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center font-accent text-xl italic text-cream-2">Nessuna fonte trovata.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {visible.map((s) => {
            const on = isFollowed(s);
            const fmt = PLATFORM_FORMAT[s.platform];
            return (
              <li
                key={s.ids[0]}
                className="flex min-h-16 items-center gap-3 border-[3px] border-cream/30 bg-surface py-1 pl-4 pr-2"
              >
                <Icon name={FORMAT_ICON[fmt]} size={20} className="shrink-0 text-cream-2" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-extrabold leading-tight">{s.name}</p>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-cream-2">{FORMAT_LABEL[fmt]}</p>
                </div>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={on ? `Non seguire più ${s.name}` : `Segui ${s.name}`}
                  onClick={() => radar.toggleFollow({ ids: s.ids, name: s.name, platform: s.platform })}
                  className={`inline-flex min-h-11 min-w-[104px] items-center justify-center gap-1.5 border-[3px] px-3 font-display text-sm font-extrabold uppercase transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none ${
                    on ? "border-cream bg-signal text-card-ink" : "border-cream/50 text-cream"
                  }`}
                >
                  {on ? (
                    <>
                      <Icon name="check" size={16} strokeWidth={3} /> Segui già
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={16} strokeWidth={3} /> Segui
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
