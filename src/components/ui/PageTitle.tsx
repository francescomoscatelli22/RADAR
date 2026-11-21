import type { ReactNode } from "react";

/** Titolo di una scheda: etichetta tecnica, titolo grande, frase d'accento in corsivo. */
export default function PageTitle({
  eyebrow,
  title,
  accent,
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        <h1 className="font-title text-[34px] font-black leading-none tracking-tight">{title}</h1>
        {accent && <p className="mt-2 font-accent text-xl italic leading-tight text-cream-2">{accent}</p>}
      </div>
      {action}
    </div>
  );
}
