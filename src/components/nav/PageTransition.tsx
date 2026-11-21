import { ViewTransition, type ReactNode } from "react";

/*
  Avvolge il contenuto di ogni scheda: quando si cambia scheda dalla barra in basso
  il contenuto scorre nella direzione giusta ("nav-forward" / "nav-back", vedi BottomNav e globals.css).
  Le altre transizioni (indietro del browser, aggiornamenti) restano senza animazione.
*/
const DIRECTION = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTION} exit={DIRECTION} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
