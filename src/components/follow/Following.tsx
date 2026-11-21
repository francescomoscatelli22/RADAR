"use client";

import { useMemo, useState } from "react";
import { FORMAT_LABEL, type Format } from "@/lib/feed";
import { useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import PageTitle from "@/components/ui/PageTitle";
import FeedView from "@/components/feed/FeedView";
import FormatFilter from "@/components/feed/FormatFilter";
import SourceDirectory from "./SourceDirectory";

type View = "news" | "sources";

/** La scheda "Seguiti": novità dalle fonti che segui e, a fianco, l'elenco delle fonti da seguire. */
export default function Following() {
  const { ready, follows } = useRadar();
  const [chosen, setChosen] = useState<View | null>(null);
  const [format, setFormat] = useState<Format>("all");
  const sourceIds = useMemo(() => follows.flatMap((f) => f.ids), [follows]);

  // finché non scegli, si parte dalle novità se segui già qualcuno, dalle fonti altrimenti
  const view: View = chosen ?? (follows.length > 0 ? "news" : "sources");
  const TABS: { id: View; label: string }[] = [
    { id: "news", label: "Novità" },
    { id: "sources", label: follows.length ? `Fonti (${follows.length})` : "Fonti" },
  ];

  return (
    <>
      <PageTitle eyebrow="Seguiti" title="Le tue fonti" accent="Solo chi scegli tu." />

      <div role="tablist" aria-label="Seguiti" className="mt-5 flex border-[3px] border-cream">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={view === t.id}
            onClick={() => setChosen(t.id)}
            className={`min-h-12 flex-1 font-display text-base font-extrabold uppercase transition-colors duration-150 motion-reduce:transition-none ${
              view === t.id ? "bg-signal text-card-ink" : "bg-surface text-cream active:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4" role="tabpanel">
        {view === "sources" ? (
          <SourceDirectory />
        ) : (
          <>
            {sourceIds.length > 0 && <FormatFilter value={format} onChange={setFormat} />}
            {sourceIds.length > 0 && (
            <FeedView
              sources={sourceIds}
              format={format}
              empty={
                <div className="border-[3px] border-cream bg-surface p-6 text-center shadow-zine">
                  <Icon name="eye" size={40} className="mx-auto mb-3 text-signal" />
                  <h2 className="font-display text-2xl font-extrabold">
                    {format === "all" ? "Niente di nuovo" : `Nessun ${FORMAT_LABEL[format].toLowerCase()}`}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[30ch] font-accent text-xl italic text-cream-2">
                    Le fonti che segui non hanno pubblicato niente di recente.
                  </p>
                  <Button className="mt-5" onClick={() => setChosen("sources")}>
                    Scopri altre fonti
                  </Button>
                </div>
              }
            />
            )}
            {ready && sourceIds.length === 0 && (
              <div className="border-[3px] border-cream bg-surface p-6 text-center shadow-zine">
                <Icon name="eye" size={40} className="mx-auto mb-3 text-signal" />
                <h2 className="font-display text-2xl font-extrabold">Non segui ancora nessuno</h2>
                <p className="mx-auto mt-2 max-w-[30ch] font-accent text-xl italic text-cream-2">
                  Scegli le fonti di cui ti fidi: qui trovi solo le loro novità.
                </p>
                <Button className="mt-5" onClick={() => setChosen("sources")}>
                  Scegli le fonti
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
