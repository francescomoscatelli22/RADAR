import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon from "./Icon";

/*
  Chip zine: pillola con bordo spesso. Selezionata = giallo segnale con segno di spunta
  (il segno serve a chi non distingue i colori: il colore non è l'unico indicatore).
  Alta almeno 44 px: l'area di tocco minima consigliata su iPhone.
*/
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  selected?: boolean;
  children: ReactNode;
  tone?: "default" | "group";
};

export default function Chip({ selected = false, tone = "default", children, className = "", ...rest }: Props) {
  const base =
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[2.5px] px-4 font-display text-[15px] font-bold leading-none transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
  const look = selected
    ? "border-cream bg-signal text-card-ink"
    : tone === "group"
      ? "border-cream bg-surface-2 text-cream"
      : "border-cream/40 bg-transparent text-cream hover:border-cream";
  return (
    <button type="button" aria-pressed={selected} className={`${base} ${look} ${className}`} {...rest}>
      {selected && <Icon name="check" size={16} strokeWidth={3} />}
      {children}
    </button>
  );
}
