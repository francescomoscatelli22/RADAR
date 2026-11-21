"use client";

import { memo, useState } from "react";
import { PLATFORM_FORMAT, prettyDuration, timeAgo, type FeedItem } from "@/lib/feed";
import { radar, useRadar } from "@/lib/store";
import Icon, { type IconName } from "@/components/ui/Icon";

/*
  Una card per formato, in stile zine: blocco di colore, bordo nero spesso, ombra dura.
  Tutta la card è un link all'originale (il titolo ha un'area di tocco "stirata");
  i tre pulsanti in basso (salva, segui la fonte, condividi) stanno sopra al link.
  Si salva solo titolo, anteprima e link: il contenuto resta sul sito originale.
*/

const FORMAT_STYLE = {
  video: { label: "Video", icon: "play", bg: "bg-card-video" },
  article: { label: "Articolo", icon: "article", bg: "bg-card-article" },
  podcast: { label: "Podcast", icon: "headphones", bg: "bg-card-audio" },
  thread: { label: "Thread", icon: "message", bg: "bg-card-thread" },
  release: { label: "Release", icon: "package", bg: "bg-card-code" },
} as const satisfies Record<string, { label: string; icon: IconName; bg: string }>;

function Thumb({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- immagini di siti esterni sconosciuti: non si possono elencare per next/image
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function ActionButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="relative z-10 grid size-11 place-items-center rounded-full transition-colors duration-150 active:bg-card-ink/15 aria-pressed:bg-card-ink aria-pressed:text-cream"
    >
      {children}
    </button>
  );
}

function FeedCardBase({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const { saved, follows } = useRadar();
  const [copied, setCopied] = useState(false);
  const fmt = FORMAT_STYLE[PLATFORM_FORMAT[item.platform]];
  const isSaved = saved.some((s) => s.id === item.id);
  const following = follows.some((f) => f.ids.includes(item.source.id));

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: item.url });
        return;
      }
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* l'utente ha chiuso il foglio di condivisione: niente da fare */
    }
  };

  const toggleFollow = () => radar.toggleFollow({ ids: [item.source.id], name: item.source.name, platform: item.platform });

  // le release hanno titoli come "v0.40.17": davanti ci mettiamo il nome del progetto
  const title =
    item.platform === "github" && !item.title.toLowerCase().includes(item.source.name.toLowerCase())
      ? `${item.source.name} ${item.title}`
      : item.title;
  const isVideo = item.platform === "youtube";
  const isPodcast = item.platform === "podcast";
  const duration = isPodcast ? prettyDuration(item.meta.duration) : null;

  return (
    <article
      className={`rise relative border-[3px] border-card-ink ${fmt.bg} text-card-ink shadow-zine transition-transform duration-100 active:translate-x-0.5 active:translate-y-0.5 motion-reduce:transition-none`}
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      {isVideo && item.image && (
        <div className="relative aspect-video overflow-hidden border-b-[3px] border-card-ink bg-card-ink">
          <Thumb src={item.image} className="size-full object-cover" />
          <div className="halftone pointer-events-none absolute inset-0" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full border-[3px] border-card-ink bg-cream text-card-ink shadow-zine-ink">
              <Icon name="play" size={24} filled className="translate-x-0.5" />
            </span>
          </span>
        </div>
      )}

      <div className="flex gap-3 p-4 pb-2">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-card-ink px-2 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-cream">
              <Icon name={fmt.icon} size={12} strokeWidth={2.5} filled={isVideo} />
              {fmt.label}
            </span>
            {item.platform === "hn" && item.meta.points !== undefined && (
              <span className="font-mono text-[11px] font-bold">▲ {item.meta.points}</span>
            )}
            {duration && <span className="font-mono text-[11px] font-bold">{duration}</span>}
          </div>

          <h2 className="font-display text-xl font-extrabold leading-[1.15] tracking-tight [text-wrap:balance]">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-4 after:absolute after:inset-0 after:content-['']"
            >
              {title}
              <span className="sr-only"> (si apre in una nuova scheda)</span>
            </a>
          </h2>

          {!isVideo && item.platform !== "hn" && item.summary && (
            <p className="mt-2 line-clamp-3 font-reading text-[15px] leading-snug text-card-ink/80">{item.summary}</p>
          )}

          {item.platform === "hn" && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 font-mono text-[11px] font-bold">
              {item.meta.comments !== undefined && <span>{item.meta.comments} commenti</span>}
              {item.meta.discussionUrl && (
                <a
                  href={item.meta.discussionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex min-h-8 items-center underline underline-offset-2"
                >
                  Apri la discussione
                </a>
              )}
            </p>
          )}
        </div>

        {!isVideo && item.image && (
          <Thumb
            src={item.image}
            className={`size-[76px] shrink-0 border-[3px] border-card-ink bg-card-ink object-cover ${isPodcast ? "" : "self-start"}`}
          />
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 pb-1 pl-4 pr-1">
        <p className="min-w-0 truncate font-mono text-[11px] font-bold uppercase tracking-wide">
          {item.source.name}
          <span className="font-medium opacity-70"> · {timeAgo(item.publishedAt)}</span>
        </p>
        <div className="flex shrink-0 items-center">
          <ActionButton
            label={following ? `Non seguire più ${item.source.name}` : `Segui ${item.source.name}`}
            pressed={following}
            onClick={toggleFollow}
          >
            <Icon name="eye" size={20} />
          </ActionButton>
          <ActionButton label={copied ? "Link copiato" : "Condividi"} onClick={share}>
            <Icon name={copied ? "check" : "share"} size={20} />
          </ActionButton>
          <ActionButton
            label={isSaved ? "Togli dai salvati" : "Salva"}
            pressed={isSaved}
            onClick={() => radar.toggleSaved(item)}
          >
            <Icon name="bookmark" size={20} filled={isSaved} />
          </ActionButton>
        </div>
      </footer>
    </article>
  );
}

const FeedCard = memo(FeedCardBase);
export default FeedCard;

/** Segnaposto della card mentre i dati arrivano (stessa altezza circa, così la pagina non salta). */
export function FeedCardSkeleton() {
  return (
    <div aria-hidden="true" className="border-[3px] border-cream/15 bg-surface p-4">
      <div className="skeleton mb-3 h-5 w-20" />
      <div className="skeleton mb-2 h-6 w-full" />
      <div className="skeleton mb-4 h-6 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  );
}
