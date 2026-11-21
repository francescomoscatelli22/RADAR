"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TopicNode } from "@/lib/feed";
import { radar, useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import Wordmark from "@/components/ui/Wordmark";

/*
  Scelta degli argomenti (chip). Serve sia alla prima volta (dopo la registrazione) sia per cambiarli.
  Gli argomenti arrivano dal database (/api/topics): l'elenco è un dato, non codice.
  Un argomento "gruppo" (es. AI generativa) vale per tutti i suoi sotto-argomenti.
*/

const DEFAULT = ["ai", "ai-generativa"]; // base di partenza: AI e AI generativa

// scorciatoie: partono da un profilo e poi si può ritoccare (gli slug che non esistono si ignorano)
const PRESETS: { label: string; slugs: string[] }[] = [
  { label: "Creativo", slugs: ["ai", "ai-generativa", "ai-prompt", "ai-workflow"] },
  { label: "Sviluppatore", slugs: ["ai", "ai-coding", "ai-agenti", "ai-llm", "ai-open-source", "ai-api", "ai-mlops"] },
  { label: "Business", slugs: ["ai", "ai-startup", "ai-marketing", "ai-produttivita", "ai-regolamentazione", "ai-pmi"] },
  { label: "Tutto", slugs: ["ai", "ai-generativa", "ai-tecnologia", "ai-strumenti", "ai-settori", "ai-societa", "ai-geografia"] },
];

type Group = { node: TopicNode; leaves: TopicNode[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function TopicPicker() {
  const router = useRouter();
  const { ready, topics: stored } = useRadar();
  const editing = stored !== null;

  const [nodes, setNodes] = useState<TopicNode[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/topics", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { topics: TopicNode[] }) => {
        setNodes(d.topics);
        setFailed(false);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setFailed(true);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const { root, groups } = useMemo(() => {
    if (!nodes) return { root: null, groups: [] as Group[] };
    const root = nodes.find((n) => n.parent === null) ?? null;
    const sort = (a: TopicNode, b: TopicNode) => a.order - b.order;
    const groups = nodes
      .filter((n) => root && n.parent === root.slug)
      .sort(sort)
      .map((node) => ({ node, leaves: nodes.filter((l) => l.parent === node.slug).sort(sort) }));
    return { root, groups };
  }, [nodes]);

  const selected = useMemo(() => new Set(draft ?? stored ?? DEFAULT), [draft, stored]);
  const set = (next: Set<string>) => setDraft([...next]);

  const toggleRoot = (slug: string) => {
    const next = new Set(selected);
    if (!next.delete(slug)) next.add(slug);
    set(next);
  };

  const toggleGroup = (g: Group) => {
    const next = new Set(selected);
    if (next.has(g.node.slug)) next.delete(g.node.slug);
    else {
      g.leaves.forEach((l) => next.delete(l.slug));
      next.add(g.node.slug);
    }
    set(next);
  };

  const toggleLeaf = (g: Group, leaf: TopicNode) => {
    const next = new Set(selected);
    if (next.has(g.node.slug)) {
      // il gruppo intero era scelto: lo "sciolgo" e tengo tutti i sotto-argomenti tranne quello toccato
      next.delete(g.node.slug);
      g.leaves.forEach((l) => l.slug !== leaf.slug && next.add(l.slug));
    } else {
      if (!next.delete(leaf.slug)) next.add(leaf.slug);
      // se ora sono scelti tutti i sotto-argomenti, vale come gruppo intero
      if (g.leaves.length > 0 && g.leaves.every((l) => next.has(l.slug))) {
        g.leaves.forEach((l) => next.delete(l.slug));
        next.add(g.node.slug);
      }
    }
    set(next);
  };

  const applyPreset = (slugs: string[]) => {
    const known = new Set(nodes?.map((n) => n.slug));
    set(new Set(slugs.filter((s) => known.has(s))));
  };

  const count = selected.size;
  const q = norm(search.trim());

  const save = () => {
    radar.setTopics([...selected]);
    router.replace("/");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col">
      <header className="px-4" style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}>
        <div className="flex h-11 items-center justify-between">
          {editing ? (
            <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 font-mono text-xs font-bold uppercase tracking-wide text-cream-2">
              <Icon name="back" size={20} /> Indietro
            </Link>
          ) : (
            <Wordmark className="text-lg" />
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-cream-2">{editing ? "Argomenti" : "Passo 1 di 1"}</span>
        </div>

        <h1 className="mt-5 font-title text-[34px] font-black leading-[1.05] tracking-tight">
          {editing ? "I tuoi argomenti" : "Cosa vuoi captare?"}
        </h1>
        <p className="mt-3 font-accent text-xl italic leading-snug text-cream-2">
          {editing
            ? "Il feed mostra solo questi. Cambiali quando vuoi."
            : "Scegli gli argomenti: il tuo feed parte da qui. Potrai cambiarli quando vuoi."}
        </p>
      </header>

      <div className="flex-1 px-4 pb-32 pt-6">
        {failed && (
          <div className="border-[3px] border-cream bg-surface p-5 text-center shadow-zine" role="alert">
            <p className="font-display text-xl font-extrabold">Non riesco a caricare gli argomenti</p>
            <p className="mt-1 text-cream-2">Controlla la connessione e riprova.</p>
            <Button className="mt-4" onClick={() => setAttempt((a) => a + 1)}>
              <Icon name="refresh" size={18} /> Riprova
            </Button>
          </div>
        )}

        {!failed && !nodes && (
          <div className="flex flex-wrap gap-2" role="status" aria-label="Carico gli argomenti">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="skeleton h-11 rounded-full" style={{ width: 70 + ((i * 37) % 70) }} />
            ))}
          </div>
        )}

        {nodes && root && (
          <>
            <section aria-label="Profili di partenza">
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">Parti da un profilo</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.slugs)}
                    className="inline-flex min-h-11 shrink-0 items-center border-[3px] border-cream bg-surface px-4 font-display text-[15px] font-extrabold uppercase shadow-zine-sm transition-[transform,box-shadow] duration-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="relative mt-6">
              <label htmlFor="topic-search" className="sr-only">
                Cerca un argomento
              </label>
              <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-2" />
              <input
                id="topic-search"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca un argomento (es. video, sanità)"
                className="h-12 w-full border-[3px] border-cream bg-surface pl-11 pr-3 font-display text-base text-cream placeholder:text-cream-2/70"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Chip tone="group" selected={selected.has(root.slug)} onClick={() => toggleRoot(root.slug)}>
                {root.label} in generale
              </Chip>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {groups.map((g, gi) => {
                const groupOn = selected.has(g.node.slug);
                const matches = q ? g.leaves.filter((l) => norm(l.label).includes(q)) : g.leaves;
                const groupMatches = q ? norm(g.node.label).includes(q) : true;
                if (q && matches.length === 0 && !groupMatches) return null;
                const picked = groupOn ? g.leaves.length : g.leaves.filter((l) => selected.has(l.slug)).length;
                return (
                  <details
                    key={g.node.slug}
                    open={q ? true : gi === 0 || picked > 0 || undefined}
                    className="group border-[3px] border-cream/30 bg-surface open:border-cream"
                  >
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-extrabold leading-tight">{g.node.label}</span>
                        <span className="block font-mono text-[11px] font-bold uppercase tracking-wide text-cream-2">
                          {picked > 0 ? `${picked} di ${g.leaves.length} scelti` : `${g.leaves.length} argomenti`}
                        </span>
                      </span>
                      <Icon name="back" size={20} className="shrink-0 -rotate-90 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" />
                    </summary>
                    <div className="flex flex-wrap gap-2 px-4 pb-4">
                      <Chip tone="group" selected={groupOn} onClick={() => toggleGroup(g)} className="w-full justify-center sm:w-auto">
                        Tutto: {g.node.label}
                      </Chip>
                      {matches.map((l) => (
                        <Chip key={l.slug} selected={groupOn || selected.has(l.slug)} onClick={() => toggleLeaf(g, l)}>
                          {l.label}
                        </Chip>
                      ))}
                    </div>
                  </details>
                );
              })}
              {q && groups.every((g) => !norm(g.node.label).includes(q) && !g.leaves.some((l) => norm(l.label).includes(q))) && (
                <p className="py-6 text-center font-accent text-xl italic text-cream-2">Nessun argomento con &ldquo;{search}&rdquo;.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* barra con il pulsante: sempre in vista, sopra la barra Home dell'iPhone */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-cream bg-bg px-4 pt-3"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
      >
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <p className="min-w-0 flex-1 font-mono text-xs font-bold uppercase leading-tight tracking-wide" aria-live="polite">
            {count === 0 ? "Scegline almeno uno" : `${count} ${count === 1 ? "scelto" : "scelti"}`}
          </p>
          <Button onClick={save} disabled={!ready || !nodes || count === 0}>
            {editing ? "Salva" : "Inizia"} <Icon name="check" size={18} strokeWidth={3} />
          </Button>
        </div>
      </div>
    </div>
  );
}
