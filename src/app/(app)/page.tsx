import ForYou from "@/components/feed/ForYou";
import PageTransition from "@/components/nav/PageTransition";

// La scheda "Per te": il feed vero si carica nel browser (dipende dagli argomenti scelti sul dispositivo).
export default function Home() {
  return (
    <PageTransition>
      <ForYou />
    </PageTransition>
  );
}
