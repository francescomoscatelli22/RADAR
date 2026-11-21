"use client";

import { useState } from "react";
import { PLATFORM_FORMAT, type Format } from "@/lib/feed";
import { useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import PageTitle from "@/components/ui/PageTitle";
import FeedCard from "@/components/feed/FeedCard";
import FormatFilter from "@/components/feed/FormatFilter";

/** La scheda "Salvati": le copie (titolo, anteprima, link) dei contenuti messi da parte. Si rileggono anche offline. */
export default function Saved() {
  const { ready, saved } = useRadar();
  const [format, setFormat] = useState<Format>("all");
  const shown = format === "all" ? saved : saved.filter((i) => PLATFORM_FORMAT[i.platform] === format);

  return (
    <>
      <PageTitle eyebrow="Salvati" title="Da leggere" accent="Messi da parte per dopo." />

      {ready && saved.length === 0 ? (
        <div className="mt-6 border-[3px] border-cream bg-surface p-6 text-center shadow-zine">
          <Icon name="bookmark" size={40} className="mx-auto mb-3 text-signal" />
          <h2 className="font-display text-2xl font-extrabold">Ancora niente qui</h2>
          <p className="mx-auto mt-2 max-w-[30ch] font-accent text-xl italic text-cream-2">
            Tocca il segnalibro su una card: la ritrovi qui, anche senza rete.
          </p>
          <Button href="/" className="mt-5">
            Vai ai segnali
          </Button>
        </div>
      ) : (
        <>
          {saved.length > 0 && <FormatFilter value={format} onChange={setFormat} />}
          <ul className="mt-2 flex flex-col gap-5">
            {shown.map((item, i) => (
              <li key={item.id}>
                <FeedCard item={item} index={i} />
              </li>
            ))}
          </ul>
          {saved.length > 0 && shown.length === 0 && (
            <p className="py-10 text-center font-accent text-xl italic text-cream-2">Nessun salvato di questo formato.</p>
          )}
        </>
      )}
    </>
  );
}
