"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useRadar } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync";
import { FORMAT_LABEL, type Format } from "@/lib/feed";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import PageTitle from "@/components/ui/PageTitle";
import { FeedCardSkeleton } from "./FeedCard";
import FeedView from "./FeedView";
import FormatFilter from "./FormatFilter";

/** La scheda "Per te": feed cronologico degli argomenti scelti. */
export default function ForYou() {
  const router = useRouter();
  const { ready, topics } = useRadar();
  const { user, loading } = useAuth();
  const sync = useSyncStatus();
  // con un account si aspetta di sapere se gli argomenti ci sono già (scelti su un altro dispositivo)
  const waiting = loading || (user !== null && sync !== "ready");
  const [format, setFormat] = useState<Format>("all");

  // chi non ha ancora scelto gli argomenti va prima a sceglierli
  useEffect(() => {
    if (ready && !waiting && topics === null) router.replace("/argomenti");
  }, [ready, waiting, topics, router]);

  if (!ready || topics === null) {
    return (
      <div className="flex flex-col gap-5" aria-hidden="true">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </div>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="Per te"
        title="Segnali"
        accent="Dal mondo AI, in ordine di arrivo."
        action={
          <Link
            href="/argomenti"
            className="mb-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 border-[3px] border-cream bg-surface px-3 font-mono text-[11px] font-bold uppercase tracking-wide shadow-zine-sm transition-[transform,box-shadow] duration-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Icon name="sliders" size={16} />
            {topics.length} argomenti
          </Link>
        }
      />
      <FormatFilter value={format} onChange={setFormat} />
      <FeedView
        topics={topics}
        format={format}
        empty={
          <div className="border-[3px] border-cream bg-surface p-6 text-center shadow-zine">
            <Icon name="radar" size={40} className="mx-auto mb-3 text-signal" />
            <h2 className="font-display text-2xl font-extrabold">
              {format === "all" ? "Radar è in ascolto" : `Nessun ${FORMAT_LABEL[format].toLowerCase()} per ora`}
            </h2>
            <p className="mx-auto mt-2 max-w-[30ch] font-accent text-xl italic text-cream-2">
              {format === "all"
                ? "Nessun segnale per i tuoi argomenti, ancora. Prova ad aggiungerne altri."
                : "Il radar non ha captato niente di questo formato nei tuoi argomenti."}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {format !== "all" && (
                <Button variant="ghost" onClick={() => setFormat("all")}>
                  Tutti i formati
                </Button>
              )}
              <Button href="/argomenti">Cambia argomenti</Button>
            </div>
          </div>
        }
      />
    </>
  );
}
